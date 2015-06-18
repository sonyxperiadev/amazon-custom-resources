#!/bin/bash
#
# deploy-lambda.sh

func='route53Dependency'
role_stack_name='route53-dependency-support'

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
$current_dir/../deploy-lambda.sh $func $role_stack_name
