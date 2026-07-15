#!/bin/bash

clear
rm -rf src/libs
rm -rf lib/cdkLibs
aws s3 cp s3://everest.prod.repositorios/src/ ./src --recursive
aws s3 cp s3://everest.prod.repositorios/lib/ ./lib --recursive
rm -rf dist
tsc
# cdk synth --all