#!/bin/bash
region='eu-west-1'

if [ $# -lt 3 ]
then
  echo 'Missing required parameters'
  echo "Usage $0 <function> <event_script> <param>"
  exit 1
fi


func="$1"
event_script="$2"
param="$3"

function_arn() {
  aws lambda get-function-configuration \
    --region $region \
    --function-name $func \
    | jq '.FunctionArn' \
    | tr -d \"
}

func_arn=$(function_arn)
payload="$($event_script $func_arn $param)"

aws lambda invoke \
 --function-name $func \
 --region $region \
 --payload "$payload" \
 --log-type Tail \
 context-done.log \
 | jq .LogResult | tr -d \" | base64 --decode
