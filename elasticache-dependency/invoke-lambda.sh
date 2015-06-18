#!/bin/bash
current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

func='elasticacheDependency'
event_script="$current_dir/event.json.sh"
param=${1:-"tap-re-1p7mhl19hxzx4"}

$current_dir/../invoke-lambda.sh $func $event_script $param
