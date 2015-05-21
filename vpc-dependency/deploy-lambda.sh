#!/bin/bash
#
# deploy-lambda.sh

func='vpcDependency'
role_stack_name='vpc-dependency-support'

current_dir=`readlink -f ${BASH_SOURCE[0]%/*.sh}`
$current_dir/../deploy-lambda.sh $func $role_stack_name
