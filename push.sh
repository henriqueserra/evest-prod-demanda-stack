#!/bin/bash
clear
full_date=$(date +"%Y-%m-%d_%H-%M-%S")
mkdir -p ../historico/everest-prod-demanda-stack/$current_date/push/$current_time
cp -r ./src ../historico/everest-prod-demanda-stack/$current_date/push/$current_time/src
cp -r ./lib ../historico/everest-prod-demanda-stack/$current_date/push/$current_time/lib
cp -r ./bin ../historico/everest-prod-demanda-stack/$current_date/push/$current_time/bin
git add .
git commit -m "Generic push $(date '+%Y-%m-%d %H:%M')"
git push origin main