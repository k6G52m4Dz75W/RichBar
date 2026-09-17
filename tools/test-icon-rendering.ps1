$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$header = [IO.File]::ReadAllText((Join-Path $root 'RichBar.h'))
$start = $header.IndexOf('static HANDLE& MdIconFontResource()')
if ($start -lt 0) { throw 'Lucide font helpers not found; core implementation must be ready first' }
$end = $header.IndexOf('COLORREF GetBarGlyphColor()', $start)
if ($end -lt 0) { throw 'Drawing methods end not found' }
$methods = $header.Substring($start, $end - $start)
$defines = ([regex]::Matches($header, '(?m)^#define (?:MD_TEXT_HEIGHT|MD_CODE_HEIGHT|MD_SUBSCRIPT_HEIGHT|MD_ICON_MODE_H|MD_ICON_MODE_M)\s+\d+')).Value -join "`n"
$prefix = @'
#include <windows.h>
#include <strsafe.h>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <cwchar>
#include <vector>
#define StringPrintf StringCchPrintfW
#define IDR_LUCIDE_FONT 200
static HINSTANCE EEGetInstanceHandle() { return GetModuleHandle(NULL); }
static bool failAdd = false, missingGlyph = false;
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
        Check(currentIcon >= 0 && currentIcon < 20 && n == 1 && s[0] == expected[currentIcon].ch,
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
$batch = "@call `"$vcvars`" >nul`r`n@if errorlevel 1 exit /b %errorlevel%`r`n@rc /nologo /fo test.res test.rc`r`n@if errorlevel 1 exit /b %errorlevel%`r`n@cl /nologo /EHsc /std:c++14 /DUNICODE /D_UNICODE test.cpp test.res user32.lib gdi32.lib /Fe:test.exe`r`n@exit /b %errorlevel%`r`n"
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
