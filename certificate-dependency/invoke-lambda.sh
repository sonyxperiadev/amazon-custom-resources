#!/bin/bash
current_dir=`readlink -f ${BASH_SOURCE[0]%/*.sh}`

func='certificateDependency'
event_script="$current_dir/event.json.sh"
param=${1:-"star_lifelog-dev_sonymobile_com_201505"}

$current_dir/../invoke-lambda.sh $func $event_script $param

