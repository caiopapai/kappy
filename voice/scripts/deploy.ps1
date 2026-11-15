$ErrorActionPreference = "Stop"

$FUNCTION_NAME = "kappy-voice"
$REGION        = ""
$HANDLER       = "lambda_function.lambda_handler"
$ZIP_FILE      = "kappy-voice.zip"
$BUILD_DIR     = "build"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Split-Path -Parent $ScriptDir)

Write-Host "▶ A construir pacote Lambda..." -ForegroundColor Cyan

if (Test-Path $BUILD_DIR) {
    Remove-Item -Recurse -Force $BUILD_DIR
    Write-Host "  Pasta build/ limpa"
}
if (Test-Path $ZIP_FILE) {
    Remove-Item -Force $ZIP_FILE
    Write-Host "  ZIP anterior removido"
}

New-Item -ItemType Directory -Path $BUILD_DIR | Out-Null

Write-Host "▶ A instalar dependências..." -ForegroundColor Cyan
pip install `
    -r lambda\requirements.txt `
    -t $BUILD_DIR `
    --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao instalar dependências" -ForegroundColor Red
    exit 1
}

Write-Host "▶ A copiar código fonte..." -ForegroundColor Cyan
Copy-Item -Recurse -Force lambda\* $BUILD_DIR\

Write-Host "▶ A criar ZIP..." -ForegroundColor Cyan

Compress-Archive `
    -Path "$BUILD_DIR\*" `
    -DestinationPath $ZIP_FILE `
    -Force

$ZipSize = (Get-Item $ZIP_FILE).Length / 1KB
Write-Host "✅ ZIP criado: $ZIP_FILE ($([math]::Round($ZipSize))KB)" -ForegroundColor Green

Write-Host "▶ A verificar função Lambda..." -ForegroundColor Cyan

$ErrorActionPreference = "Continue"
aws lambda get-function `
    --function-name $FUNCTION_NAME `
    --region $REGION `
    --output text 2>$null | Out-Null
$FunctionExists = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = "Stop"

if ($FunctionExists) {
    Write-Host "▶ A actualizar função Lambda existente..." -ForegroundColor Cyan

    $Result = aws lambda update-function-code `
        --function-name $FUNCTION_NAME `
        --zip-file "fileb://$ZIP_FILE" `
        --region $REGION `
        --output text `
        --query "FunctionArn"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro no deploy" -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ Lambda actualizado!" -ForegroundColor Green
    Write-Host "   ARN: $Result"
} else {
    Write-Host ""
    Write-Host "   Função '$FUNCTION_NAME' não existe na AWS." -ForegroundColor Yellow
    Write-Host "   Cria-a manualmente na consola AWS com:" -ForegroundColor Yellow
    Write-Host "   - Runtime : python3.11"
    Write-Host "   - Handler : $HANDLER"
    Write-Host "   - Timeout : 10 segundos"
    Write-Host "   - Permissões: AWSLambdaBasicExecutionRole"
    Write-Host ""
    Write-Host "   Depois corre este script novamente para fazer deploy do código."
}