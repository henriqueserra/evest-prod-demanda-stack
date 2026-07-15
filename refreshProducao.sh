rm -rf ./lib
mkdir -p ./lib
cp -r /Users/henriqueserra/everest-dev-demanda-stack/lib/* ./lib
rm -rf ./src
mkdir -p ./src
cp -r /Users/henriqueserra/everest-dev-demanda-stack/src/* ./src
rm -rf ./bin
mkdir -p ./bin
cp -r /Users/henriqueserra/everest-dev-demanda-stack/bin/* ./bin
node update-deps.js