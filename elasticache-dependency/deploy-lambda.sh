#!/bin/bash
#
# deploy-lambda.sh

func='elasticacheDependency'
role_stack_name='elasticache-dependency-support'

../deploy-lambda.sh $func $role_stack_name
