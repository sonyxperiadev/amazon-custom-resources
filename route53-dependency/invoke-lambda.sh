#!/bin/bash
region='eu-west-1'
func='route53Dependency'

domain_name=${1:-lifelog-dev.sonymobile.com}

function_arn() {
  aws lambda get-function-configuration \
    --function-name $func \
    | jq '.FunctionArn' \
    | tr -d \"
}

function_arn=$(function_arn)
payload="$(./event.json.sh $domain_name $func_arn)"

aws lambda invoke \
 --function-name $func \
 --region $region \
 --payload "$payload" \
 --log-type Tail \
 context-done.log \
 | jq .LogResult | tr -d \" | base64 --decode
