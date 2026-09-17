param([switch]$ExpectLegacyBug)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$header = [IO.File]::ReadAllText((Join-Path $root 'RichBar.h'))
$start = $header.IndexOf('void DrawMdText(')
$end = $header.IndexOf('COLORREF GetBarGlyphColor()', $start)
if ($start -lt 0 -or $end -lt 0) { throw 'Drawing methods not found' }
$methods = $header.Substring($start, $end - $start)
$defines = ([regex]::Matches($header, '(?m)^#define (?:GLYPH_SIZE_SCALE|MD_ICON_MODE_H|MD_ICON_MODE_M)\s+\d+')).Value -join "`n"
$prefix = @'
#include <windows.h>
#include <strsafe.h>
#include <cstdio>
#include <vector>
#include <cstdlib>
#define StringPrintf StringCchPrintfW
static int probes = 0, glyphDraws = 0;
static DWORD Probe(HDC dc, LPCWSTR s, int n, LPWORD out, DWORD flags) {
    ++probes;
    return GetGlyphIndicesW(dc, s, n, out, flags);
}
static int Draw(HDC dc, LPCWSTR s, int n, LPRECT r, UINT flags) {
    if (n == 1 && s[0] == 0xE71B) {
        ++glyphDraws;
        wchar_t face[LF_FACESIZE] = {};
        GetTextFaceW(dc, LF_FACESIZE, face);
        if (lstrcmpiW(face, L"Segoe Fluent Icons") != 0) std::exit(3);
    }
    return DrawTextW(dc, s, n, r, flags);
}
#define GetGlyphIndicesW Probe
#define DrawTextW Draw
struct Renderer {
'@
$suffix = @'
};
#undef GetGlyphIndicesW
#undef DrawTextW
static std::vector<DWORD> Render(int size, COLORREF fg, int mode) {
    HDC dc = CreateCompatibleDC(NULL);
    BITMAPINFO info = {};
    info.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    info.bmiHeader.biWidth = size;
    info.bmiHeader.biHeight = -size;
    info.bmiHeader.biPlanes = 1;
    info.bmiHeader.biBitCount = 32;
    void* bits = NULL;
    HBITMAP bmp = CreateDIBSection(dc, &info, DIB_RGB_COLORS, &bits, NULL, 0);
    if (!dc || !bmp || !bits) std::exit(4);
    HGDIOBJ oldBmp = SelectObject(dc, bmp);
    RECT rc = {0, 0, size, size};
    HBRUSH bg = CreateSolidBrush(RGB(255, 0, 255));
    FillRect(dc, &rc, bg);
    DeleteObject(bg);
    if (mode == 0) {
        Renderer().DrawMdIcon(dc, size, 16, fg);
    } else if (mode == 1) {
        HFONT font = CreateFontW(-(size * GLYPH_SIZE_SCALE / 100), 0, 0, 0,
            FW_NORMAL, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS,
            CLIP_DEFAULT_PRECIS, ANTIALIASED_QUALITY, FF_DONTCARE, L"Segoe Fluent Icons");
        HGDIOBJ oldFont = SelectObject(dc, font);
        WORD index = 0xFFFF;
        const wchar_t ch = 0xE71B;
        if (GetGlyphIndicesW(dc, &ch, 1, &index, GGI_MARK_NONEXISTING_GLYPHS) == GDI_ERROR || index == 0xFFFF) std::exit(5);
        SetBkMode(dc, TRANSPARENT);
        SetTextColor(dc, fg);
        DrawTextW(dc, &ch, 1, &rc, DT_CENTER | DT_VCENTER | DT_SINGLELINE);
        SelectObject(dc, oldFont);
        DeleteObject(font);
    } else {
        HPEN pen = CreatePen(PS_SOLID, max(1, size / 16), fg);
        HGDIOBJ oldPen = SelectObject(dc, pen);
        HGDIOBJ oldBrush = SelectObject(dc, GetStockObject(NULL_BRUSH));
        RoundRect(dc, size*8/100, size*42/100, size*52/100, size*70/100, size*20/100, size*20/100);
        RoundRect(dc, size*48/100, size*30/100, size*92/100, size*58/100, size*20/100, size*20/100);
        SelectObject(dc, oldBrush);
        SelectObject(dc, oldPen);
        DeleteObject(pen);
    }
    GdiFlush();
    std::vector<DWORD> pixels((DWORD*)bits, (DWORD*)bits + size*size);
    for (auto& p : pixels) p &= 0xFFFFFF;
    SelectObject(dc, oldBmp);
    DeleteObject(bmp);
    DeleteDC(dc);
    return pixels;
}
int main(int argc, char**) {
    const bool legacy = argc > 1;
    for (int size : {16, 24, 32}) {
        for (COLORREF fg : {RGB(48,48,48), RGB(224,224,224)}) {
            auto actual = Render(size, fg, 0);
            bool glyph = actual == Render(size, fg, 1);
            bool fallback = actual == Render(size, fg, 2);
            printf("size=%d fg=%06lx matchesE71B=%d matchesFallback=%d\n", size, (unsigned long)fg, glyph, fallback);
            if (legacy ? (!fallback || glyph) : (!glyph || fallback)) return 1;
        }
    }
    printf("probe calls=%d E71B draw calls=%d\n", probes, glyphDraws);
    if (legacy ? (probes != 0 || glyphDraws != 0) : (probes == 0 || glyphDraws != 6)) return 2;
    puts("PASS");
}
'@
$temp = Join-Path ([IO.Path]::GetTempPath()) ('richbar-icon-test-' + [guid]::NewGuid())
New-Item -ItemType Directory $temp | Out-Null
[IO.File]::WriteAllText((Join-Path $temp 'test.cpp'), ($prefix + "`n" + $defines + "`n" + $methods + $suffix))
$vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
$install = & $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if (!$install) { throw 'Visual C++ build tools not found' }
$vcvars = Join-Path $install 'VC\Auxiliary\Build\vcvars64.bat'
$batch = "@call `"$vcvars`" >nul`r`n@cl /nologo /EHsc /std:c++14 /DUNICODE /D_UNICODE test.cpp user32.lib gdi32.lib /Fe:test.exe`r`n@exit /b %errorlevel%`r`n"
[IO.File]::WriteAllText((Join-Path $temp 'build.cmd'), $batch)
Push-Location $temp
try {
    & cmd.exe /c build.cmd
    if ($LASTEXITCODE -ne 0) { throw 'Test compilation failed' }
    if ($ExpectLegacyBug) { & .\test.exe legacy } else { & .\test.exe }
    if ($LASTEXITCODE -ne 0) { throw "Rendering regression failed ($LASTEXITCODE)" }
} finally { Pop-Location }
Write-Output "Test artifacts: $temp"
