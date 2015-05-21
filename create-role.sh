#!/bin/bash

region='eu-west-1'

if [ $# -lt 2 ]
then
  echo 'Missing required parameters'
  echo "Usage $0 <stack_name> <template>"
  exit 1
fi


stack_name="$1"
template="$2"

aws cloudformation create-stack \
  --region $region \
  --stack-name $stack_name \
  --template-body "`cat $template`" \
  --capabilities CAPABILITY_IAM

