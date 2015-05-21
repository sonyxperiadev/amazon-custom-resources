#!/bin/bash

stack_name="test-route53-stack-$(date +%y%d%m)"
if aws cloudformation describe-stacks --stack-name $stack_name >/dev/null 2>&1
then
  echo "test-route53-stack exists, deleting..."
  aws cloudformation delete-stack --stack-name $stack_name
  echo "Please, wait a while to invoke this script again"
  for i in [1 2 3 4 5]; do
    echo -n .
    sleep 1
  done
  echo .
  exit
fi
echo "Creating stack $stack_name, run script again TODAY to delete"
aws cloudformation create-stack --stack-name $stack_name --template-body "$(cat test-stack.template)"
