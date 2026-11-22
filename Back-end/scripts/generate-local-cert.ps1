$ErrorActionPreference = 'Stop'

$backendRoot = Split-Path -Parent $PSScriptRoot
$secretsDirectory = Join-Path $backendRoot 'secrets'
$certificatePath = Join-Path $secretsDirectory 'localhost.p12'
$keytool = Get-Command keytool.exe -ErrorAction SilentlyContinue
if (-not $keytool) { $keytool = Get-Command keytool -ErrorAction SilentlyContinue }
if (-not $keytool) { throw 'Não encontrei o keytool. Instale um JDK e adicione a pasta bin ao PATH.' }

New-Item -ItemType Directory -Path $secretsDirectory -Force | Out-Null
if (Test-Path -LiteralPath $certificatePath) {
    throw "O certificado local já existe em $certificatePath. Apague-o manualmente se quiser gerar outro."
}

& $keytool.Source -genkeypair -alias localhost -keyalg RSA -keysize 3072 -storetype PKCS12 `
    -keystore $certificatePath -storepass changeit -keypass changeit -validity 825 `
    -dname 'CN=localhost, OU=Development, O=Usereuser, L=Sao Paulo, ST=SP, C=BR' `
    -ext 'SAN=dns:localhost,ip:127.0.0.1'
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível criar o certificado HTTPS local.' }
Write-Host "Certificado local criado: $certificatePath"
