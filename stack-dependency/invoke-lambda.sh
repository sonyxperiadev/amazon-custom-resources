#!/bin/bash
region='eu-west-1'
func='stackDependency'

stack_name=${1:-StackDependencySupport}

function_arn() {
  aws lambda get-function-configuration \
    --function-name $func \
    | jq '.FunctionArn' \
    | tr -d \"
}

function_arn=$(function_arn)
payload="$(./event.json.sh $stack_name $func_arn)"

aws lambda invoke \
 --function-name $func \
 --region $region \
 --payload "$payload" \
 --log-type Tail \
 context-done.log \
 | jq .LogResult | tr -d \" | base64 --decode
