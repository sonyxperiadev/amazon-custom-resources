#!/bin/bash

template="./route53-dependency-role.template"
region='eu-west-1'
stack_name='Route53DependencySupport'

aws cloudformation create-stack \
  --region $region \
  --stack-name $stack_name \
  --template-body "`cat $template`" \
  --capabilities CAPABILITY_IAM

