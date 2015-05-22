#!/bin/bash

current_dir=`readlink -f ${BASH_SOURCE[0]%/*.sh}`
template="$current_dir/stack-dependency-role.template"
stack_name='stack-dependency-support'

$current_dir/../create-role.sh $stack_name $template
