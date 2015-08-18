#!/bin/bash
#
# deploy-lambda.sh
# Zip and deploy lambda function
#

func='kmsKey'
role_stack_name='kms-key-support'

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
$current_dir/../deploy-lambda.sh $func $role_stack_name

