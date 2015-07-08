#!/bin/bash

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
template="$current_dir/kms-key-role.template"
stack_name='kms-key-support'

$current_dir/../create-role.sh $stack_name $template

