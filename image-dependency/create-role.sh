#!/bin/bash

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
template="$current_dir/image-dependency-role.template"
stack_name='image-dependency-support'

$current_dir/../create-role.sh $stack_name $template

