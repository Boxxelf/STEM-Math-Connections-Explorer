# 本地靜態網站服務器（僅用 Windows PowerShell，無需 Python/Node）
# 用法：在 PowerShell 中執行 .\serve.ps1  或  .\serve.ps1 8888

$Port = if ($args[0]) { [int]$args[0] } else { 8000 }
$Root = $PSScriptRoot
$Prefix = "http://localhost:$Port/"

$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add($Prefix)
$Listener.Start()
Write-Host "本地服務器已啟動"
Write-Host "主站 (CS):  $Prefix"
Write-Host "MechE 站:   ${Prefix}meche/"
Write-Host "按 Ctrl+C 停止"
Write-Host ""

while ($Listener.IsListening) {
    $Context = $Listener.GetContext()
    $Request = $Context.Request
    $Response = $Context.Response
    $LocalPath = [Uri]::UnescapeDataString($Request.Url.LocalPath).TrimStart('/').TrimEnd('/')
    if ([string]::IsNullOrEmpty($LocalPath)) { $LocalPath = "index.html" }
    $FilePath = Join-Path -Path $Root -ChildPath $LocalPath
    if (-not [System.IO.Path]::GetFullPath($FilePath).StartsWith([System.IO.Path]::GetFullPath($Root))) {
        $Response.StatusCode = 403
        $Response.Close()
        continue
    }
    # 若路徑是目錄，改為請求該目錄下的 index.html
    if (Test-Path -Path $FilePath -PathType Container) {
        $FilePath = Join-Path -Path $FilePath -ChildPath "index.html"
    }
    if (-not (Test-Path -Path $FilePath -PathType Leaf)) {
        $Response.StatusCode = 404
        $Response.Close()
        continue
    }
    $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
    $Ext = [System.IO.Path]::GetExtension($FilePath).ToLowerInvariant()
    $ContentType = switch ($Ext) {
        '.html' { 'text/html; charset=utf-8' }
        '.js'   { 'application/javascript; charset=utf-8' }
        '.css'  { 'text/css; charset=utf-8' }
        '.json' { 'application/json; charset=utf-8' }
        '.csv'  { 'text/csv; charset=utf-8' }
        '.ico'  { 'image/x-icon' }
        default { 'application/octet-stream' }
    }
    $Response.ContentType = $ContentType
    $Response.ContentLength64 = $Bytes.Length
    $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
    $Response.Close()
}
