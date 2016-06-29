#!/bin/bash

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
template="$current_dir/sns-subscription-role.template"
stack_name='sns-subscription-support'

$current_dir/../create-role.sh $stack_name $template
