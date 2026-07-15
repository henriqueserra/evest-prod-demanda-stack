#!/bin/bash

start_time=$(date +%s)

tsc
clear
git add .
git commit -m "Creating Container"
git push origin main
# Increment the version number in package.json
npm version patch
clear
echo
echo "Deploying to AWS..."
rm -rf dist
rm -rf cdk.out
cdk synth --all --quiet
time cdk deploy --all --require-approval never --timeout 3600 --quiet --concurrency 3
# Push the changes to the remote repository
current_time=$(date +"%H-%M-%S")
current_date=$(date +"%Y-%m-%d")
mkdir -p ../historico/everest-prod-demanda-stack/$current_date/deploy/$current_time
cp -r ./src ../historico/everest-prod-demanda-stack/$current_date/deploy/$current_time/src
cp -r ./lib ../historico/everest-prod-demanda-stack/$current_date/deploy/$current_time/lib
cp -r ./bin ../historico/everest-prod-demanda-stack/$current_date/deploy/$current_time/bin
git add .
git commit -m "Creating Container"
git push origin main

end_time=$(date +%s)
execution_time=$((end_time - start_time))
echo
echo
echo
echo
echo
echo
echo "Total execution time: $execution_time seconds"
echo
echo
echo
echo
echo
echo