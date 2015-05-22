#!/bin/bash

current_dir=`readlink -f ${BASH_SOURCE[0]%/*.sh}`
template="$current_dir/image-dependency-role.template"
stack_name='image-dependency-support'

$current_dir/../create-role.sh $stack_name $template

