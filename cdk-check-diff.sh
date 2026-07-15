#!/bin/bash
clear

# Lista todas as stacks do app CDK e compara com o que está deployado
# Requer que você esteja no diretório do projeto CDK e tenha AWS credentials configuradas

echo "🔍 Verificando diferenças entre stacks locais e deployadas..."

# Pega a lista de stacks no app atual
stacks=$(cdk list)

# Variável para rastrear se alguma stack teve diferença
dif_found=0

# Loop em cada stack para verificar diferença
for stack in $stacks; do
  echo "🧪 Verificando stack: $stack"
  
  # Executa cdk diff para a stack atual
  diff_output=$(cdk diff "$stack")

  # Verifica se houve saída relevante (sem ser "There were no differences")
  if [[ "$diff_output" != *"There were no differences"* ]]; then
    echo "⚠️ Diferença detectada na stack: $stack"
    dif_found=1
  fi
done

if [ "$dif_found" -eq 0 ]; then
  echo "✅ Todas as stacks estão em sincronia com o deploy."
else
  echo "🚨 Há stacks com diferenças. Considere revisar e possivelmente fazer deploy."
fi