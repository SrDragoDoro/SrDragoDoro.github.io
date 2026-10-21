# Servidor estático mínimo para desarrollo local (Windows, sin instalar nada).
#
#   powershell -ExecutionPolicy Bypass -File .\serve.ps1
#   powershell -ExecutionPolicy Bypass -File .\serve.ps1 8770
#
# Después: http://localhost:8770
param(
  [int]$Port = 8770,
  [string]$Root = (Split-Path -Parent $MyInvocation.MyCommand.Path)
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Sirviendo $Root en http://localhost:$Port/  (Ctrl+C para parar)"

# Tipos MIME de los archivos que usa el sitio.
$mimes = @{
  '.html' = 'text/html; charset=utf-8'; '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'; '.svg' = 'image/svg+xml'
  '.webp' = 'image/webp'; '.mp4' = 'video/mp4'; '.png' = 'image/png'
  '.jpg'  = 'image/jpeg'; '.gif'  = 'image/gif'; '.json' = 'application/json'
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $path = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrEmpty($path)) { $path = 'index.html' }
    $file = Join-Path $Root ($path -replace '/', '\')
    if (Test-Path -LiteralPath $file -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
      $ctx.Response.ContentType = if ($mimes.ContainsKey($ext)) { $mimes[$ext] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
  } catch {
    $ctx.Response.StatusCode = 500
  } finally {
    $ctx.Response.Close()
  }
}
