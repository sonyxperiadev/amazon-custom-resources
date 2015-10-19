#!/bin/bash
#
# deploy-lambda.sh

func='ecsTask'
role_stack_name='ecs-task-support'


npm install --production
zip -r ecsTask.zip ./ecsTask.js ./node_modules

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
$current_dir/../deploy-lambda.sh $func $role_stack_name "$current_dir/ecsTask.zip"
