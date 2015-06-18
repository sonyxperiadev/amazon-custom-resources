#!/bin/bash
#
# deploy-lambda.sh

func='vpcDependency'
role_stack_name='vpc-dependency-support'

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
$current_dir/../deploy-lambda.sh $func $role_stack_name
