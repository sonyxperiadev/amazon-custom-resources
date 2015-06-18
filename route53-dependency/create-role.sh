#!/bin/bash

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
template="$current_dir/route53-dependency-role.template"
stack_name='route53-dependency-support'

$current_dir/../create-role.sh $stack_name $template

