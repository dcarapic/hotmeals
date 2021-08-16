$ErrorActionPreference = "Stop"

if(Test-Path ..\deploy) {
    Remove-item ..\deploy\ -force -recurse
}

Set-Location hotmeals-client
npm run build
if ($LASTEXITCODE -ne 0) { exit }
Set-Location ..


Set-Location hotmeals-server
dotnet publish -o ../../deploy
if ($LASTEXITCODE -ne 0) { exit }
Set-Location ..

xcopy .\hotmeals-client\build\ ..\deploy\client\build\ /e /r /y
xcopy ..\db\hotmeals.sqlite ..\deploy\db\


