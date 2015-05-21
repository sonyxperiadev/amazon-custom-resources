#!/bin/bash

template="./stack-dependency-role.template"
region='eu-west-1'
stack_name='StackDependencySupport'

aws cloudformation create-stack \
  --region $region \
  --stack-name $stack_name \
  --template-body "`cat $template`" \
  --capabilities CAPABILITY_IAM

