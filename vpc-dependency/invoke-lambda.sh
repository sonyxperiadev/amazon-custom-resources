#!/bin/bash
region='eu-west-1'
func='vpcDependency'

vpc_name=${1:-default}

function_arn() {
  aws lambda get-function-configuration \
    --function-name $func \
    | jq '.FunctionArn' \
    | tr -d \"
}

func_arn=$(function_arn)
payload="$(./event.json.sh $vpc_name $func_arn)"

aws lambda invoke \
 --function-name $func \
 --region $region \
 --payload "$payload" \
 --log-type Tail \
 context-done.log \
 | jq .LogResult | tr -d \" | base64 --decode
