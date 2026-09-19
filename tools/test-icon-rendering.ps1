$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$header = [IO.File]::ReadAllText((Join-Path $root 'RichBar.h'))
$start = $header.IndexOf('static HANDLE& MdIconFontResource()')
if ($start -lt 0) { throw 'Icon font helpers not found; core implementation must be ready first' }
$end = $header.IndexOf('COLORREF GetBarGlyphColor()', $start)
if ($end -lt 0) { throw 'Drawing methods end not found' }
$methods = $header.Substring($start, $end - $start)
$bitmapStart = $header.IndexOf('HBITMAP CreateMdIconBitmap(')
$bitmapEnd = $header.IndexOf('static HANDLE& MdIconFontResource()', $bitmapStart)
$listStart = $header.IndexOf('void AddModeSwitchIcons(')
$listEnd = $header.IndexOf('void DisplayBar(', $listStart)
if ($bitmapStart -lt 0 -or $listStart -lt 0 -or $listEnd -lt 0) { throw 'Image-list helpers not found' }
$methods = $header.Substring($bitmapStart, $bitmapEnd - $bitmapStart) + $methods + $header.Substring($listStart, $listEnd - $listStart)
$defines = ([regex]::Matches($header, '(?m)^#define (?:MD_TEXT_HEIGHT|MD_CODE_HEIGHT|MD_SUBSCRIPT_HEIGHT|MD_ICON_MODE_H|MD_ICON_MODE_M)\s+\d+')).Value -join "`n"
$prefix = @'
#include <windows.h>
#include <commctrl.h>
#ifndef ILCF_COPY
#define ILCF_COPY 0x00000002
#endif
#define MODE_HTML 0
#define MODE_MD 1
#define GLYPH_COLOR_DARK RGB(48,48,48)
#include <strsafe.h>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cwchar>
#include <vector>
#define StringPrintf StringCchPrintfW
#define IDR_ICON_FONT 200
static HINSTANCE EEGetInstanceHandle() { return GetModuleHandle(NULL); }
static bool failAdd = false, missingGlyph = false, htmlTests = false;
static int addCalls = 0, added = 0, removeCalls = 0, probes = 0, faceCalls = 0, puaDraws = 0;
static int currentIcon = -1, currentSize = 0;
static COLORREF currentColor = 0;
static HANDLE liveRegistration = NULL;
static void Check(bool ok, const char* what) {
    if (!ok) {
        fprintf(stderr, "FAIL icon=%d size=%d color=%06lx: %s\n", currentIcon, currentSize,
            (unsigned long)currentColor, what);
        std::exit(1);
    }
}
// Independent oracle: never derive this mapping from the extracted production methods.
struct ExpectedGlyph { int icon; wchar_t ch; };
static const ExpectedGlyph expected[] = {
    {0, 0xEDE6}, {1, 0xEDE7}, {2, 0xEDE8}, {3, 0xEDE9}, {4, 0xEDEA},
    {5, 0xEDEB}, {6, 0xEAD1}, {7, 0xEE6B}, {8, 0xF1AB}, {9, 0xEBAD},
    {10, 0xEBA7}, {11, 0xEC51}, {12, 0xEEBE}, {13, 0xEEBB}, {14, 0xEEB9},
    {15, 0xF1AF}, {16, 0xEEB2}, {17, 0xEE4B}, {18, 0xF1DE}, {19, 0xF0EE}
};
// [H][M] mode-switch glyphs: html5-fill, markdown-fill.
static const WCHAR modeExpected[] = { 0xEE40, 0xEF1D };
static const WCHAR htmlExpected[] = {
    0xEE03,0xEFC8,0xF200,0xEAD1,0xEE6B,0xF244,0xED8C,0xEFC5,
    0xEE4B,0xEEB2,0xF1DE,0xF1AF,0xEAEB,0xEA27,0xEA25,0xEA28,
    0xEA26,0xEEBB,0xEEBE,0xEE54,0xEE55,0xEF1C,0xEFC2,0xECEF,
    0xF0EE,0xECED,0xEE5E,0xEED0,0xECDB,0xEB85,0xF050,0xEA7A,
    0xF327,0xF39A,0xEC0A,0xEAE9,0xECB7,0xF2F5,0xEB31,0xEC36,
    0xF0BB,0xF029,0xED9E,0xEB97,0xEA21,0xEE59,0xED3B,0xEF83
};
static bool HasPua(LPCWSTR s, int n) {
    if (n < 0) n = (int)wcslen(s);
    for (int i = 0; i < n; ++i) if (s[i] >= 0xE000 && s[i] <= 0xF8FF) return true;
    return false;
}
static void ValidateGlyph(HDC dc, wchar_t ch) {
    wchar_t face[LF_FACESIZE] = {};
    Check(GetTextFaceW(dc, LF_FACESIZE, face) > 0 && lstrcmpiW(face, L"remixicon") == 0,
        "actual selected font is not remixicon");
    WORD index = 0xFFFF;
    Check(GetGlyphIndicesW(dc, &ch, 1, &index, GGI_MARK_NONEXISTING_GLYPHS) != GDI_ERROR &&
        index != 0 && index != 0xFFFF, "Remix icon glyph index is invalid");
}
static HANDLE AddFont(PVOID data, DWORD size, PVOID reserved, DWORD* count) {
    ++addCalls;
    Check(!liveRegistration, "duplicate memory-font registration");
    HRSRC res = FindResourceW(EEGetInstanceHandle(), MAKEINTRESOURCEW(200), RT_RCDATA);
    Check(res && size == SizeofResource(EEGetInstanceHandle(), res), "wrong font resource size");
    const void* embedded = LockResource(LoadResource(EEGetInstanceHandle(), res));
    Check(embedded && data && memcmp(data, embedded, size) == 0, "registration is not the embedded subset");
    if (failAdd) { *count = 0; return NULL; }
    HANDLE handle = AddFontMemResourceEx(data, size, reserved, count);
    Check(handle && *count > 0, "real AddFontMemResourceEx failed");
    liveRegistration = handle;
    ++added;
    return handle;
}
static BOOL RemoveFont(HANDLE handle) {
    ++removeCalls;
    Check(handle && handle == liveRegistration, "removing wrong or already released registration");
    BOOL result = RemoveFontMemResourceEx(handle);
    Check(result != FALSE, "real RemoveFontMemResourceEx failed");
    liveRegistration = NULL;
    return result;
}
static int Face(HDC dc, int count, LPWSTR name) {
    ++faceCalls;
    return GetTextFaceW(dc, count, name);
}
static DWORD Probe(HDC dc, LPCWSTR s, int n, LPWORD out, DWORD flags) {
    ++probes;
    Check(flags & GGI_MARK_NONEXISTING_GLYPHS, "glyph probe must mark missing glyphs");
    if (missingGlyph) {
        for (int i = 0; i < n; ++i) out[i] = 0xFFFF;
        return n;
    }
    return GetGlyphIndicesW(dc, s, n, out, flags);
}
static int Draw(HDC dc, LPCWSTR s, int n, LPRECT r, UINT flags) {
    if (HasPua(s, n)) {
        ++puaDraws;
        Check(!failAdd && !missingGlyph, "glyph draw attempted while font unavailable");
        wchar_t expect = 0;
        if (!htmlTests && currentIcon >= 0 && currentIcon < 20) expect = expected[currentIcon].ch;
        else if (!htmlTests && currentIcon >= 20 && currentIcon < 22) expect = modeExpected[currentIcon - 20];
        Check(expect == 0 || (n == 1 && s[0] == expect), "wrong mapped glyph drawn");
        ValidateGlyph(dc, s[0]);
    }
    return DrawTextW(dc, s, n, r, flags);
}
static BOOL Text(HDC dc, int x, int y, LPCWSTR s, int n) {
    Check(!HasPua(s, n), "unexpected PUA TextOutW draw");
    return TextOutW(dc, x, y, s, n);
}
#define AddFontMemResourceEx AddFont
#define RemoveFontMemResourceEx RemoveFont
#define GetTextFaceW Face
#define GetGlyphIndicesW Probe
#define DrawTextW Draw
#define TextOutW Text
struct Renderer {
    int m_iMode = MODE_MD;
'@
$suffix = @'
};
#undef AddFontMemResourceEx
#undef RemoveFontMemResourceEx
#undef GetTextFaceW
#undef GetGlyphIndicesW
#undef DrawTextW
#undef TextOutW
static std::vector<DWORD> Render(int size, COLORREF fg, int icon, bool direct = false) {
    currentIcon = icon; currentSize = size; currentColor = fg;
    HDC dc = CreateCompatibleDC(NULL);
    Check(dc != NULL, "CreateCompatibleDC failed");
    BITMAPINFO info = {};
    info.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    info.bmiHeader.biWidth = size;
    info.bmiHeader.biHeight = -size;
    info.bmiHeader.biPlanes = 1;
    info.bmiHeader.biBitCount = 32;
    void* bits = NULL;
    HBITMAP bmp = CreateDIBSection(dc, &info, DIB_RGB_COLORS, &bits, NULL, 0);
    Check(bmp && bits, "CreateDIBSection failed");
    HGDIOBJ oldBmp = SelectObject(dc, bmp);
    RECT rc = {0, 0, size, size};
    HBRUSH bg = CreateSolidBrush(RGB(255, 0, 255));
    FillRect(dc, &rc, bg);
    DeleteObject(bg);
    if (!direct) {
        // A fresh renderer each time must still share the process registration.
        Renderer().DrawMdIcon(dc, size, icon, fg);
    } else {
        Check(icon >= 0 && icon < 20 && expected[icon].icon == icon, "invalid oracle entry");
        HFONT font = CreateFontW(-size, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
            DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, ANTIALIASED_QUALITY,
            FF_DONTCARE, L"remixicon");
        Check(font != NULL, "reference CreateFontW failed");
        HGDIOBJ oldFont = SelectObject(dc, font);
        Check(oldFont && oldFont != HGDI_ERROR, "reference SelectObject failed");
        ValidateGlyph(dc, expected[icon].ch);
        SetBkMode(dc, TRANSPARENT);
        SetTextColor(dc, fg);
        Check(DrawTextW(dc, &expected[icon].ch, 1, &rc, DT_CENTER | DT_VCENTER | DT_SINGLELINE) != 0,
            "reference DrawTextW failed");
        SelectObject(dc, oldFont);
        DeleteObject(font);
    }
    GdiFlush();
    std::vector<DWORD> pixels((DWORD*)bits, (DWORD*)bits + size*size);
    for (auto& p : pixels) { p &= 0xFFFFFF; }
    SelectObject(dc, oldBmp);
    DeleteObject(bmp);
    DeleteDC(dc);
    return pixels;
}
static bool HasInk(const std::vector<DWORD>& pixels) {
    for (auto p : pixels) if (p != 0xFF00FF) return true;
    return false;
}
static void Sweep(bool fallback) {
    int comparisons = 0, cases = 0;
    for (int size : {16, 20, 24, 32, 36, 48, 72}) {
        for (COLORREF fg : {RGB(48,48,48), RGB(224,224,224)}) {
            for (int icon = 0; icon <= 21; ++icon) {
                int drawsBefore = puaDraws, probesBefore = probes, facesBefore = faceCalls;
                auto actual = Render(size, fg, icon);
                Check(HasInk(actual) == !fallback,
                    fallback ? "fallback slot must stay blank" : "empty icon bitmap");
                Check(puaDraws - drawsBefore == (fallback ? 0 : 1), "incorrect PUA draw count");
                if (!failAdd) {
                    Check(probes == probesBefore + 1 && faceCalls == facesBefore + 1,
                        "each glyph must check actual face and glyph index");
                }
                if (!fallback && icon < 20) {
                    Check(actual == Render(size, fg, icon, true), "pixels differ from direct Remix drawing");
                    ++comparisons;
                }
                ++cases;
            }
        }
    }
    printf("%s: cases=%d exact-Remix=%d/%d PUA-draws=%d\n",
        fallback ? "fallback" : "normal", cases, comparisons, fallback ? 0 : 280, puaDraws);
}
static void ReleaseAndCheck() {
    int before = removeCalls;
    bool installed = liveRegistration != NULL;
    Renderer::ReleaseMdIconFont();
    Check(!Renderer::MdIconFontResource() && !liveRegistration, "release did not null resource");
    Check(removeCalls == before + (installed ? 1 : 0), "incorrect removal count");
    Renderer::ReleaseMdIconFont();
    Check(removeCalls == before + (installed ? 1 : 0), "release is not idempotent");
}
static void TestImageLists(bool fallback) {
    htmlTests = true;
    Renderer renderer;
    int comparisons = 0;
    for (int size : {16, 24, 32}) {
        for (int mode : {MODE_HTML, MODE_MD, MODE_HTML}) {
            renderer.m_iMode = mode;
            int count = mode == MODE_HTML ? 48 : 20;
            for (COLORREF fg : {RGB(48,48,48), RGB(224,224,224)}) {
                HIMAGELIST list = renderer.BuildToolbarImageList(size, fg, mode);
                Check(list && ImageList_GetImageCount(list) == count+2, "wrong command image-list count (commands + H/M)");
                // Reads the stored image's alpha channel straight from the
                // icon's color bitmap; DrawIconEx would paint an all-zero-
                // alpha (blank) icon opaque black and mask this case.
                auto slotHasInk = [&](HIMAGELIST li, int iconIdx) {
                    HICON hi = ImageList_GetIcon(li, iconIdx, ILD_TRANSPARENT);
                    Check(hi != NULL, "ImageList_GetIcon failed");
                    ICONINFO ii = {};
                    Check(GetIconInfo(hi, &ii), "GetIconInfo failed");
                    bool ink = false;
                    if (ii.hbmColor) {
                        HDC dc2 = CreateCompatibleDC(NULL);
                        BITMAPINFO info2 = {};
                        info2.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
                        info2.bmiHeader.biWidth = size;
                        info2.bmiHeader.biHeight = -size;
                        info2.bmiHeader.biPlanes = 1;
                        info2.bmiHeader.biBitCount = 32;
                        std::vector<DWORD> px(size*size);
                        if (GetDIBits(dc2, ii.hbmColor, 0, size, px.data(), &info2, DIB_RGB_COLORS)) {
                            for (DWORD q : px) if ((q & 0xFF000000) != 0) { ink = true; break; }
                        }
                        DeleteDC(dc2);
                        DeleteObject(ii.hbmColor);
                    }
                    if (ii.hbmMask) DeleteObject(ii.hbmMask);
                    DestroyIcon(hi);
                    return ink;
                };
                for (int icon = 0; icon < count+2; ++icon) {
                    // Diagnostic tag: MD=100+, HTML=200+.
                    currentIcon = icon + (mode == MODE_MD ? 100 : 200);
                    currentSize = size; currentColor = fg;
                    HDC dc = CreateCompatibleDC(NULL);
                    void* bits = NULL;
                    HBITMAP bmp = renderer.CreateMdIconBitmap(size, &bits);
                    Check(dc && bmp && bits, "list test bitmap allocation failed");
                    HGDIOBJ old = SelectObject(dc, bmp);
                    HICON hicon = ImageList_GetIcon(list, icon, ILD_TRANSPARENT);
                    Check(hicon && DrawIconEx(dc, 0, 0, hicon, size, size, 0, NULL, DI_NORMAL), "icon draw failed");
                    if (hicon) DestroyIcon(hicon);
                    GdiFlush();
                    std::vector<DWORD> actual((DWORD*)bits, (DWORD*)bits+size*size);
                    for (auto& p : actual) p &= 0xFFFFFF;
                    if (fallback) {
                        bool isDropdown = mode == MODE_HTML && (icon == 0 || icon == 6 || icon == 23);
                        if (isDropdown) {
                            // the affordance arrow is chrome: it always draws
                            for (int p=0; p<size*size; ++p) ((DWORD*)bits)[p] = 0xFF00FF;
                            renderer.DrawDropdownArrow(dc, size, fg);
                            GdiFlush();
                            std::vector<DWORD> arrow((DWORD*)bits,(DWORD*)bits+size*size);
                            for (auto& p : arrow) p &= 0xFFFFFF;
                            for (int p=0; p<size*size; ++p) ((DWORD*)bits)[p] = 0xFF00FF;
                            Check(actual == arrow, "fallback dropdown slot must contain exactly the arrow");
                        } else {
                            Check(!slotHasInk(list, icon), "fallback command slot must stay blank");
                        }
                        ++comparisons;
                        SelectObject(dc,old); DeleteObject(bmp); DeleteDC(dc);
                        continue;
                    }
                    Check(HasInk(actual), "empty image-list slot");
                    for (int p=0; p<size*size; ++p) ((DWORD*)bits)[p] = 0xFF00FF;
                    WCHAR ch = icon >= count ? modeExpected[icon - count]
                             : (mode == MODE_HTML ? htmlExpected[icon] : expected[icon].ch);
                    HFONT font = CreateFontW(-size,0,0,0,FW_NORMAL,FALSE,FALSE,FALSE,DEFAULT_CHARSET,
                        OUT_DEFAULT_PRECIS,CLIP_DEFAULT_PRECIS,ANTIALIASED_QUALITY,FF_DONTCARE,L"remixicon");
                    HGDIOBJ oldFont = SelectObject(dc,font);
                    ValidateGlyph(dc,ch);
                    SetBkMode(dc,TRANSPARENT); SetTextColor(dc,fg);
                    RECT rc = {0,0,size,size};
                    Check(DrawTextW(dc,&ch,1,&rc,DT_CENTER|DT_VCENTER|DT_SINGLELINE), "direct list reference draw failed");
                    SelectObject(dc,oldFont); DeleteObject(font);
                    if (mode == MODE_HTML && (icon == 0 || icon == 6 || icon == 23)) {
                        // dropdown slots carry the baked-in affordance arrow
                        renderer.DrawDropdownArrow(dc, size, fg);
                    }
                    GdiFlush();
                    std::vector<DWORD> reference((DWORD*)bits,(DWORD*)bits+size*size);
                    for (auto& p : reference) p &= 0xFFFFFF;
                    if (actual != reference) {
                        for (int p = 0; p < size*size; ++p) {
                            if (actual[p] != reference[p]) {
                                fprintf(stderr, "DIFF px(%d,%d) list=%06lx ref=%06lx tag=%d\n",
                                    p % size, p / size, actual[p], reference[p], currentIcon);
                                break;
                            }
                        }
                    }
                    Check(actual == reference, "image-list pixels differ from expected glyph/foreground/fallback");
                    ++comparisons;
                    SelectObject(dc,old); DeleteObject(bmp); DeleteDC(dc);
                }
                ImageList_Destroy(list);
            }
        }
    }
    Renderer::ReleaseMdIconFont();
    printf("PASS actual HTML/MD image lists, H/M slots, HTML-MD-HTML rebuilds: %d pixel comparisons (%s)\n", comparisons, fallback ? "fallback" : "Remix");
}
int main(int argc, char** argv) {
    Check(argc == 2, "expected normal, add-fail or missing-glyph argument");
    failAdd = strcmp(argv[1], "add-fail") == 0;
    missingGlyph = strcmp(argv[1], "missing-glyph") == 0;
    Check(failAdd || missingGlyph || strcmp(argv[1], "normal") == 0, "unknown scenario");
    printf("scenario=%s\n", argv[1]);
    Check(!Renderer::MdIconFontResource() && addCalls == 0, "registration must be lazy");
    ReleaseAndCheck();
    Sweep(failAdd || missingGlyph);
    if (failAdd) {
        Check(addCalls == 308 && added == 0 && probes == 0 && puaDraws == 0,
            "failed registration must retry without probing/drawing PUA");
        // Recovery without release also verifies a failed install was not cached.
        failAdd = false;
        auto recovered = Render(24, RGB(48,48,48), 16);
        Check(recovered == Render(24, RGB(48,48,48), 16, true), "registration retry did not recover");
        Check(added == 1 && addCalls == 309, "retry must register exactly once");
    } else {
        Check(addCalls == 1 && added == 1, "registration not shared across renderers and sizes");
        if (missingGlyph) Check(probes == 308 && puaDraws == 0, "missing-glyph fallback not exercised");
    }
    ReleaseAndCheck();
    Check(removeCalls == 1, "first registration not removed exactly once");
    missingGlyph = false;
    int beforeAdds = addCalls;
    Sweep(false);
    Check(addCalls == beforeAdds + 1 && added == 2 && removeCalls == 1,
        "render after release must reinitialize once");
    ReleaseAndCheck();
    Check(added == removeCalls && removeCalls == 2, "registration/removal counts unbalanced");
    printf("PASS %s: add-attempts=%d registered=%d removed=%d probes=%d PUA-draws=%d; reinit/idempotent-release PASS\n",
        argv[1], addCalls, added, removeCalls, probes, puaDraws);
    failAdd = strcmp(argv[1], "add-fail") == 0;
    missingGlyph = strcmp(argv[1], "missing-glyph") == 0;
    TestImageLists(failAdd || missingGlyph);
    return 0;
}
'@
$temp = Join-Path ([IO.Path]::GetTempPath()) ('richbar-icon-test-' + [guid]::NewGuid())
New-Item -ItemType Directory $temp | Out-Null
[IO.File]::WriteAllText((Join-Path $temp 'test.cpp'), ($prefix + "`n" + $defines + "`n" + $methods + $suffix))
# Copy the actual checked-in subset, not a system font or a generated stand-in.
Copy-Item (Join-Path $root 'remixicon_subset.ttf') (Join-Path $temp 'remixicon_subset.ttf')
[IO.File]::WriteAllText((Join-Path $temp 'test.rc'), "200 RCDATA `"remixicon_subset.ttf`"`r`n")
$vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
$install = & $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if (!$install) { throw 'Visual C++ build tools not found' }
$vcvars = Join-Path $install 'VC\Auxiliary\Build\vcvars64.bat'
$batch = "@call `"$vcvars`" >nul`r`n@if errorlevel 1 exit /b %errorlevel%`r`n@rc /nologo /fo test.res test.rc`r`n@if errorlevel 1 exit /b %errorlevel%`r`n@cl /nologo /EHsc /std:c++14 /DUNICODE /D_UNICODE test.cpp test.res user32.lib gdi32.lib comctl32.lib /Fe:test.exe`r`n@exit /b %errorlevel%`r`n"
[IO.File]::WriteAllText((Join-Path $temp 'build.cmd'), $batch)
Push-Location $temp
try {
    & cmd.exe /c build.cmd
    if ($LASTEXITCODE -ne 0) { throw "Test compilation failed ($LASTEXITCODE)" }
    # Each scenario has fresh process-local registration state.
    foreach ($scenario in @('normal', 'add-fail', 'missing-glyph')) {
        & .\test.exe $scenario
        if ($LASTEXITCODE -ne 0) { throw "Rendering regression failed: $scenario ($LASTEXITCODE)" }
    }
} finally {
    Pop-Location
    Write-Output "Test artifacts: $temp"
}
Write-Output 'PASS: all Remix icon rendering scenarios'
