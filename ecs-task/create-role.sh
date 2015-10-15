#!/bin/bash

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
template="$current_dir/ecs-task-role.template"
stack_name='ecs-task-support'

$current_dir/../create-role.sh $stack_name $template
