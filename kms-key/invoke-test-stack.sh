#!/bin/bash

current_dir=`readlink -f ${BASH_SOURCE[0]%/*.sh}`

template=$current_dir/test-stack.template

$current_dir/../test-stack.sh $template
