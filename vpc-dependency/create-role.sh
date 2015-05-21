#!/bin/bash

template="./vpc-dependency-role.template"
region='eu-west-1'
stack_name='VpcDependencySupport'

aws cloudformation create-stack \
  --region $region \
  --stack-name $stack_name \
  --template-body "`cat $template`" \
  --capabilities CAPABILITY_IAM

