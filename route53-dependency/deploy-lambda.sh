#!/bin/bash
#
# deploy-lambda.sh

func='route53Dependency'
role_stack_name='route53-dependency-support'

current_dir=`readlink -f ${BASH_SOURCE[0]%/*.sh}`
$current_dir/../deploy-lambda.sh $func $role_stack_name
