#!/bin/bash
#
# deploy-lambda.sh

func='elasticacheDependency'
role_stack_name='elasticache-dependency-support'

current_dir=`readlink -f ${BASH_SOURCE[0]%/*.sh}`
$current_dir/../deploy-lambda.sh $func $role_stack_name
