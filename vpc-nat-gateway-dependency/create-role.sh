#!/bin/bash

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
template="$current_dir/vpc-nat-gateway-dependency-role.template"
stack_name='vpc-nat-gateway-dependency-support'

$current_dir/../create-role.sh $stack_name $template
