#!/bin/bash

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
template="$current_dir/lambda-with-config-role.template"
stack_name='lambda-with-config-support'

$current_dir/../create-role.sh $stack_name $template
