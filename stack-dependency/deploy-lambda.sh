#!/bin/bash
#
# deploy-lambda.sh

func='stackDependency'
role_stack_name='stack-dependency-support'

current_dir=`readlink -f ${BASH_SOURCE[0]%/*.sh}`
$current_dir/../deploy-lambda.sh $func $role_stack_name
