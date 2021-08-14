$ErrorActionPreference = "Stop"

Set-Location hotmeals-client
npm run build
if ($LASTEXITCODE -ne 0) { exit }
Set-Location ..


Set-Location hotmeals-server
dotnet build
Set-Location ..
if ($LASTEXITCODE -ne 0) { exit }

xcopy .\hotmeals-client\build\ .\hotmeals-server\client\build\ /e /r /y

Set-Location hotmeals-server
dotnet run

