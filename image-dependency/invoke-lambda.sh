#!/bin/bash
current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

func='imageDependency'
event_script="$current_dir/event.json.sh"
param=${1:-"docker*201505121634"}

$current_dir/../invoke-lambda.sh $func $event_script $param

