Add-Type @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public class WinEnum {
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb, IntPtr lp);
    [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr hwnd, EnumWindowsProc cb, IntPtr lp);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint pid);
    [DllImport("user32.dll")] public static extern int GetClassName(IntPtr hwnd, StringBuilder sb, int max);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hwnd, StringBuilder sb, int max);
    public delegate bool EnumWindowsProc(IntPtr hwnd, IntPtr lp);
    public static List<string> Found = new List<string>();
    public static uint TargetPid;
    public static bool ClassCb(IntPtr h, IntPtr lp) {
        uint pid; GetWindowThreadProcessId(h, out pid);
        if (pid == TargetPid) {
            var sb = new StringBuilder(256); GetClassName(h, sb, 256);
            var tb = new StringBuilder(256); GetWindowText(h, tb, 256);
            Found.Add(sb + " | '" + tb + "'");
        }
        return true;
    }
}
"@
$emu = Get-Process EmEditor -ErrorAction Stop | Select-Object -First 1
[WinEnum]::TargetPid = $emu.Id
[WinEnum]::Found.Clear()
[WinEnum]::EnumWindows({ param($h,$lp) [WinEnum]::ClassCb($h,$lp) }, [IntPtr]::Zero) | Out-Null
Write-Host "== TOP-LEVEL windows of EmEditor (pid $($emu.Id)) =="
[WinEnum]::Found | ForEach-Object { Write-Host $_ }
