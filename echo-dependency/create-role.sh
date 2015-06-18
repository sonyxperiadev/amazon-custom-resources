#!/bin/bash

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
template="$current_dir/echo-dependency-role.template"
stack_name='echo-dependency-support'

$current_dir/../create-role.sh $stack_name $template

