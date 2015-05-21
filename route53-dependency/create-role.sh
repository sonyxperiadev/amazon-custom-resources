#!/bin/bash

template="./route53-dependency-role.template"
stack_name='route53-dependency-support'

current_dir=`readlink -f ${BASH_SOURCE[0]%/*.sh}`
$current_dir/../create-role.sh $stack_name $template

