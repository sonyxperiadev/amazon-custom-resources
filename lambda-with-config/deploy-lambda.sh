#!/bin/bash
#
# deploy-lambda.sh

func='lambdaWithConfig'
role_stack_name='lambda-with-config-support'

npm test

rm -rf target
mkdir -p target
cp -r *.js package.json bin lib target/
pushd target
npm install --production
zip -r ../lambdaWithConfig.zip .
popd

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
$current_dir/../deploy-lambda.sh $func $role_stack_name "$current_dir/lambdaWithConfig.zip" "60"
