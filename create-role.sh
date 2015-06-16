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

stack_exists() {
  echo "Checking for stack $stack_name"
  aws cloudformation describe-stacks \
    --region $region \
    --stack-name $stack_name > /dev/null 2>&1
}

create_stack() {
  echo "CREATING stack $stack_name"
  aws cloudformation create-stack \
    --region $region \
    --stack-name $stack_name \
    --template-body "`cat $template`" \
    --capabilities CAPABILITY_IAM
}

update_stack() {
  echo "UPDATING stack $stack_name"
  aws cloudformation update-stack \
    --region $region \
    --stack-name $stack_name \
    --template-body "`cat $template`" \
    --capabilities CAPABILITY_IAM
}

if stack_exists; then
  update_stack
else
  create_stack
fi
