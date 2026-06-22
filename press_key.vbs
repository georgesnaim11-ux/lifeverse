Set WshShell = WScript.CreateObject("WScript.Shell")

' Try activating by tab title first
result = WshShell.AppActivate("Install Additional Tools for No")
If Not result Then
    ' Fall back to Windows Terminal main window
    WshShell.AppActivate "Windows Terminal"
End If

WScript.Sleep 1000
WshShell.SendKeys "{ENTER}"
WScript.Sleep 500
WshShell.SendKeys "{ENTER}"
WScript.Sleep 500
WshShell.SendKeys " "
