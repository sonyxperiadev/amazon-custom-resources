#!/bin/bash

template="./stack-dependency-role.template"
stack_name='stack-dependency-support'

current_dir=`readlink -f ${BASH_SOURCE[0]%/*.sh}`
$current_dir/../create-role.sh $stack_name $template
