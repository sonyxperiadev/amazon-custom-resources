#!/bin/bash
current_dir=`readlink -f ${BASH_SOURCE[0]%/*.sh}`

func='echoDependency'
event_script="$current_dir/event.json.sh"
param=${1:-"2015-06-16:1342"}

$current_dir/../invoke-lambda.sh $func $event_script $param

