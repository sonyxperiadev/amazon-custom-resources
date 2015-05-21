#!/bin/bash
#
# deploy-lambda.sh
# Zip and deploy lambda function
#

func='imageDependency'
role_stack_name='image-dependency-support'

current_dir=`readlink -f ${BASH_SOURCE[0]%/*.sh}`
$current_dir/../deploy-lambda.sh $func $role_stack_name

