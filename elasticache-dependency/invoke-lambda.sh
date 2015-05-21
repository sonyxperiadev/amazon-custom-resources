#!/bin/bash
region='eu-west-1'
func='elasticacheDependency'

cache_id=${1:-"bod-re-19wlnyebhn54b"}

function_arn() {
  aws lambda get-function-configuration \
    --function-name $func \
    | jq '.FunctionArn' \
    | tr -d \"
}

func_arn=$(function_arn)
payload="$(./event.json.sh $cache_id $func_arn)"

aws lambda invoke \
 --function-name $func \
 --region $region \
 --payload "$payload" \
 --log-type Tail \
 context-done.log \
 | jq .LogResult | tr -d \" | base64 --decode
