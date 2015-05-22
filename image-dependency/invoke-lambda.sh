#!/bin/bash
current_dir=`readlink -f ${BASH_SOURCE[0]%/*.sh}`

func='imageDependency'
event_script="$current_dir/event.json.sh"
param=${1:-"docker*201505121634"}

$current_dir/../invoke-lambda.sh $func $event_script $param

