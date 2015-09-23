#!/bin/bash
#
# deploy-lambda.sh
# Zip and deploy lambda function
#

set -o errexit

region='eu-west-1'

if [ $# -lt 2 ]
then
  echo 'Missing required parameters'
  echo "Usage $0 <function> <role_stack_name> [zip] [timeout]"
  exit 1
fi

func="$1"
role_stack_name="$2"
zip=${3:-"./${func}.zip"}
timeout=${4:-"10"}

file="./${func}.js"
description="Cloud Formation Custom Resource: $func"

role_arn() {
  aws cloudformation describe-stacks \
    --region $region \
    --stack-name $role_stack_name \
    | jq '.Stacks[0].Outputs[]| select(.OutputKey=="RoleArn")|.OutputValue' \
    | tr -d \"
}

zip_package() {
  zip -qr $zip $file
}

function_exists() {
  echo "Checking for function $func"
  aws lambda get-function \
    --region $region \
    --function-name $func > /dev/null 2>&1

}

create_function() {
  echo "Getting ARN for role $role_stack_name"
  local role_arn=$(role_arn)
  echo "CREATE function $func"
  aws lambda create-function \
    --region $region \
    --role $role_arn \
    --runtime nodejs \
    --function-name $func  \
    --description "$description" \
    --handler ${func}.handler \
    --timeout $timeout \
    --memory-size 128 \
    --zip-file fileb://$zip
}

update_function() {
  echo "UPDATING function $func"
  aws lambda update-function-code \
    --region $region \
    --function-name $func  \
    --zip-file fileb://$zip
}

# main
zip_package
if function_exists; then
  update_function
else
  create_function
fi

