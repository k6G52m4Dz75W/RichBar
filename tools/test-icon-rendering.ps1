$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$header = [IO.File]::ReadAllText((Join-Path $root 'RichBar.h'))
$start = $header.IndexOf('static HANDLE& MdIconFontResource()')
if ($start -lt 0) { throw 'Lucide font helpers not found; core implementation must be ready first' }
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
#define IDR_LUCIDE_FONT 200
static HINSTANCE EEGetInstanceHandle() { return GetModuleHandle(NULL); }
static bool failAdd = false, missingGlyph = false, htmlTests = false;
static const WCHAR htmlExpected[] = {
    0xE384,0xE3A3,0xE0A1,0xE05D,0xE0FB,0xE19A,0xE198,0xE1DD,
    0xE0F6,0xE102,0xE17D,0xE11C,0xE56C,0xE185,0xE182,0xE183,
    0xE184,0xE1D1,0xE106,0xE107,0xE239,0xE0F4,0xE285,0xE12C,
    0xE154,0xE086,0xE265,0xE4A3,0xE6EA,0xE559,0xE345,0xE464,
    0xE438,0xE59B,0xE21F,0xE202,0xE0BB,0xE061,0xE064,0xE0AF,
    0xE258,0xE141,0xE22D,0xE084,0xE193,0xE0F9,0xE0D1,0xE1AB
};
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
    {0, 0xE385}, {1, 0xE386}, {2, 0xE387}, {3, 0xE388}, {4, 0xE389},
    {5, 0xE38A}, {6, 0xE05D}, {7, 0xE0FB}, {8, 0xE177}, {9, 0xE093},
    {10, 0xE206}, {11, 0xE239}, {12, 0xE106}, {13, 0xE1D1}, {14, 0xE4C3},
    {15, 0xE11C}, {16, 0xE102}, {17, 0xE0F6}, {18, 0xE17D}, {19, 0xE154}
};
static bool HasPua(LPCWSTR s, int n) {
    if (n < 0) n = (int)wcslen(s);
    for (int i = 0; i < n; ++i) if (s[i] >= 0xE000 && s[i] <= 0xF8FF) return true;
    return false;
}
static void ValidateGlyph(HDC dc, wchar_t ch) {
    wchar_t face[LF_FACESIZE] = {};
    Check(GetTextFaceW(dc, LF_FACESIZE, face) > 0 && lstrcmpiW(face, L"lucide") == 0,
        "actual selected font is not Lucide");
    WORD index = 0xFFFF;
    Check(GetGlyphIndicesW(dc, &ch, 1, &index, GGI_MARK_NONEXISTING_GLYPHS) != GDI_ERROR &&
        index != 0 && index != 0xFFFF, "Lucide glyph index is invalid");
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
        Check(!failAdd && !missingGlyph, "fallback attempted a PUA draw");
        Check(htmlTests || (currentIcon >= 0 && currentIcon < 20 && n == 1 && s[0] == expected[currentIcon].ch),
            "wrong mapped glyph drawn");
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
            FF_DONTCARE, L"lucide");
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
    bool ink = false;
    for (auto& p : pixels) { p &= 0xFFFFFF; if (p != 0xFF00FF) ink = true; }
    Check(ink, "empty icon bitmap");
    SelectObject(dc, oldBmp);
    DeleteObject(bmp);
    DeleteDC(dc);
    return pixels;
}
static void Sweep(bool fallback) {
    int comparisons = 0, cases = 0;
    for (int size : {16, 20, 24, 32, 36, 48, 72}) {
        for (COLORREF fg : {RGB(48,48,48), RGB(224,224,224)}) {
            for (int icon = 0; icon <= 21; ++icon) {
                int drawsBefore = puaDraws, probesBefore = probes, facesBefore = faceCalls;
                auto actual = Render(size, fg, icon);
                bool mapped = icon < 20;
                Check(puaDraws - drawsBefore == ((!fallback && mapped) ? 1 : 0), "incorrect PUA draw count");
                if (mapped && !failAdd) {
                    Check(probes == probesBefore + 1 && faceCalls == facesBefore + 1,
                        "each glyph must check actual face and glyph index");
                }
                if (!fallback && mapped) {
                    Check(actual == Render(size, fg, icon, true), "pixels differ from direct Lucide drawing");
                    ++comparisons;
                }
                ++cases;
            }
        }
    }
    printf("%s: nonempty=%d/308 exact-Lucide=%d/%d PUA-draws=%d\n",
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
                HIMAGELIST hot = renderer.BuildHotImageList(size);
                Check(hot && ImageList_GetImageCount(hot) == count+2, "wrong hot image-list count");
                for (int state = 0; state < 2; ++state) {
                    COLORREF color = state ? RGB(48,48,48) : fg;
                    for (int icon = 0; icon < count+2; ++icon) {
                        // Diagnostic tag: MD=100+, HTML=200+, +50 for the hot list.
                        currentIcon = icon + (mode == MODE_MD ? 100 : 200) + (state ? 50 : 0);
                        currentSize = size; currentColor = color;
                        HDC dc = CreateCompatibleDC(NULL);
                        void* bits = NULL;
                        HBITMAP bmp = renderer.CreateMdIconBitmap(size, &bits);
                        Check(dc && bmp && bits, "list test bitmap allocation failed");
                        HGDIOBJ old = SelectObject(dc, bmp);
                        HICON hicon = ImageList_GetIcon(state ? hot : list, icon, ILD_TRANSPARENT);
                        Check(hicon && DrawIconEx(dc, 0, 0, hicon, size, size, 0, NULL, DI_NORMAL), "icon draw failed");
                        if (hicon) DestroyIcon(hicon);
                        GdiFlush();
                        std::vector<DWORD> actual((DWORD*)bits, (DWORD*)bits+size*size);
                        bool ink = false;
                        for (auto& p : actual) { p &= 0xFFFFFF; ink |= p != 0xFF00FF; }
                        Check(ink, "empty image-list slot");
                        for (int p=0; p<size*size; ++p) ((DWORD*)bits)[p] = 0xFF00FF;
                        if (icon >= count) {
                            renderer.DrawMdIcon(dc, size, 20+icon-count, color);                        } else if (!fallback) {
                            WCHAR ch = mode == MODE_HTML ? htmlExpected[icon] : expected[icon].ch;
                            HFONT font = CreateFontW(-size,0,0,0,FW_NORMAL,FALSE,FALSE,FALSE,DEFAULT_CHARSET,
                                OUT_DEFAULT_PRECIS,CLIP_DEFAULT_PRECIS,ANTIALIASED_QUALITY,FF_DONTCARE,L"lucide");
                            HGDIOBJ oldFont = SelectObject(dc,font);
                            ValidateGlyph(dc,ch);
                            SetBkMode(dc,TRANSPARENT); SetTextColor(dc,color);
                            RECT rc = {0,0,size,size};
                            Check(DrawTextW(dc,&ch,1,&rc,DT_CENTER|DT_VCENTER|DT_SINGLELINE), "direct list reference draw failed");
                            SelectObject(dc,oldFont); DeleteObject(font);
                        } else if (mode == MODE_HTML) {
                            renderer.DrawMdText(dc,size,L"?",14,FW_BOLD,FALSE,color);
                        } else {
                            renderer.DrawMdIcon(dc,size,icon,color);
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
                }
                ImageList_Destroy(hot); ImageList_Destroy(list);
            }
        }
    }
    Renderer::ReleaseMdIconFont();
    printf("PASS actual HTML/MD normal+hot image lists, H/M slots, HTML-MD-HTML rebuilds: %d pixel comparisons (%s)\n", comparisons, fallback ? "fallback" : "Lucide");
}
static void TestPressedCopies() {
    // Mirrors DisplayBar's pressed-state mechanism: on a dark band the normal
    // list is built with a second, dark-drawn copy of every image appended
    // after the light ones; each dark copy must equal the hot list's image.
    Renderer renderer;
    renderer.m_iMode = MODE_HTML;
    const int size = 16;
    const COLORREF fg = RGB(224,224,224), hotFg = RGB(48,48,48);
    auto drawPixels = [&](HIMAGELIST list, int icon) {
        HDC dc = CreateCompatibleDC(NULL);
        BITMAPINFO info = {};
        info.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
        info.bmiHeader.biWidth = size; info.bmiHeader.biHeight = -size;
        info.bmiHeader.biPlanes = 1; info.bmiHeader.biBitCount = 32;
        void* bits = NULL;
        HBITMAP bmp = CreateDIBSection(dc, &info, DIB_RGB_COLORS, &bits, NULL, 0);
        Check(dc && bmp && bits, "pressed-copy test bitmap failed");
        HGDIOBJ old = SelectObject(dc, bmp);
        RECT rc = {0, 0, size, size};
        HBRUSH bg = CreateSolidBrush(RGB(255, 0, 255));
        FillRect(dc, &rc, bg);
        DeleteObject(bg);
        HICON hicon = ImageList_GetIcon(list, icon, ILD_TRANSPARENT);
        Check(hicon && DrawIconEx(dc, 0, 0, hicon, size, size, 0, NULL, DI_NORMAL), "pressed-copy icon draw failed");
        if (hicon) DestroyIcon(hicon);
        GdiFlush();
        std::vector<DWORD> pixels((DWORD*)bits, (DWORD*)bits + size*size);
        for (auto& p : pixels) p &= 0xFFFFFF;
        SelectObject(dc, old);
        DeleteObject(bmp);
        DeleteDC(dc);
        return pixels;
    };
    HIMAGELIST normal = renderer.BuildToolbarImageList(size, fg, MODE_HTML, 2);
    int light = ImageList_GetImageCount(normal) / 2;
    Check(light == 50, "normal list with dark copies has unexpected count");
    HIMAGELIST hot = renderer.BuildToolbarImageList(size, hotFg, MODE_HTML);
    Check(ImageList_GetImageCount(hot) == light, "hot list must mirror the light images");
    for (int i = 0; i < light; ++i)
        Check(drawPixels(normal, light + i) == drawPixels(hot, i), "dark copy differs from its hot image");
    Check(drawPixels(normal, 0) != drawPixels(normal, light), "dark copy must differ from the light glyph");
    ImageList_Destroy(hot);
    ImageList_Destroy(normal);
    renderer.ReleaseMdIconFont();
    printf("PASS pressed-state dark copies drawn into the normal list: %d images verified\n", light);
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
        Check(addCalls == 280 && added == 0 && probes == 0 && puaDraws == 0,
            "failed registration must retry without probing/drawing PUA");
        // Recovery without release also verifies a failed install was not cached.
        failAdd = false;
        auto recovered = Render(24, RGB(48,48,48), 16);
        Check(recovered == Render(24, RGB(48,48,48), 16, true), "registration retry did not recover");
        Check(added == 1 && addCalls == 281, "retry must register exactly once");
    } else {
        Check(addCalls == 1 && added == 1, "registration not shared across renderers and sizes");
        if (missingGlyph) Check(probes == 280 && puaDraws == 0, "missing-glyph fallback not exercised");
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
    TestPressedCopies();
    return 0;
}
'@
$temp = Join-Path ([IO.Path]::GetTempPath()) ('richbar-icon-test-' + [guid]::NewGuid())
New-Item -ItemType Directory $temp | Out-Null
[IO.File]::WriteAllText((Join-Path $temp 'test.cpp'), ($prefix + "`n" + $defines + "`n" + $methods + $suffix))
# Copy the actual checked-in subset, not a system font or a generated stand-in.
Copy-Item (Join-Path $root 'lucide_subset.ttf') (Join-Path $temp 'lucide_subset.ttf')
[IO.File]::WriteAllText((Join-Path $temp 'test.rc'), "200 RCDATA `"lucide_subset.ttf`"`r`n")
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
Write-Output 'PASS: all Lucide rendering scenarios'
