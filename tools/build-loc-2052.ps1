# Build only; deployment is a separate step so locked DLLs are never bypassed.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$loc = Join-Path $root 'mui\RichBar_loce'
$out = Join-Path $root 'x64\Release\Plugins\mui\2052'
$vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
$install = & $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if (!$install) { throw 'Visual C++ build tools not found' }
$vcvars = Join-Path $install 'VC\Auxiliary\Build\vcvars64.bat'
New-Item -ItemType Directory -Force $out | Out-Null
$batch = "@call `"$vcvars`" >nul`r`n@rc /nologo /D LOC_LANG_2052 /Fo `"$out\RichBar_loc.res`" `"$loc\richbar_loce.rc`"`r`n@if errorlevel 1 exit /b 1`r`n@link /nologo /DLL /NOENTRY /NODEFAULTLIB /MACHINE:X64 /OUT:`"$out\RichBar_loc.dll`" `"$out\RichBar_loc.res`"`r`n@exit /b %errorlevel%`r`n"
$batchPath = Join-Path $out 'build.cmd'
[IO.File]::WriteAllText($batchPath, $batch)
Push-Location $loc
try {
    & cmd.exe /c $batchPath
    if ($LASTEXITCODE -ne 0) { throw "Chinese satellite build failed ($LASTEXITCODE)" }
} finally { Pop-Location }
Write-Output "Built: $out\RichBar_loc.dll (LANG_CHINESE, 0x804); not deployed"
