set -e

FUNCTION_NAME="kappy-voice"
REGION="" 
RUNTIME="python3.11"
HANDLER="lambda_function.lambda_handler"
ZIP_FILE="kappy-voice.zip"
BUILD_DIR="build"

echo "▶ A construir pacote Lambda..."

rm -rf $BUILD_DIR $ZIP_FILE

mkdir -p $BUILD_DIR

pip install \
  -r lambda/requirements.txt \
  -t $BUILD_DIR \
  --quiet

cp -r lambda/* $BUILD_DIR/

cd $BUILD_DIR
zip -r ../$ZIP_FILE . -q
cd ..

echo "✅ ZIP criado: $ZIP_FILE ($(du -sh $ZIP_FILE | cut -f1))"

if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION &>/dev/null; then
  echo "▶ A actualizar função Lambda existente..."
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://$ZIP_FILE \
    --region $REGION \
    --output text \
    --query 'FunctionArn'
  echo "✅ Lambda actualizado!"
else
  echo "   Função '$FUNCTION_NAME' não existe."
  echo "   Cria-a manualmente na consola AWS com:"
  echo "   - Runtime: $RUNTIME"
  echo "   - Handler: $HANDLER"
  echo "   - Permissões: AWSLambdaBasicExecutionRole"
  echo "   Depois corre este script novamente para fazer deploy do código."
fi