#!/bin/bash
#
# deploy-lambda.sh

func='ecsTask'
role_stack_name='ecs-task-support'

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
$current_dir/../deploy-lambda.sh $func $role_stack_name
