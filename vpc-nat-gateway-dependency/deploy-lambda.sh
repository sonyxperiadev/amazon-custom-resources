#!/bin/bash
#
# deploy-lambda.sh

func='vpcNATGatewayDependency'
role_stack_name='vpc-nat-gateway-dependency-support'

rm -rf target
mkdir -p target
cp -r *.js package.json bin lib target/
pushd target
npm install --production
zip -r ../vpcNATGatewayDependency.zip .
popd

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
$current_dir/../deploy-lambda.sh $func $role_stack_name "${current_dir}/vpcNATGatewayDependency.zip" "60"
