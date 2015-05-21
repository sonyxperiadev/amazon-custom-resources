#!/bin/bash

template="./elasticache-dependency-role.template"
stack_name='elasticache-dependency-support'

current_dir=`readlink -f ${BASH_SOURCE[0]%/*.sh}`
$current_dir/../create-role.sh $stack_name $template
