#!/bin/bash

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

func='vpcDependency'
event_script="$current_dir/event.json.sh"
param=${1:-"default"}

$current_dir/../invoke-lambda.sh $func $event_script $param
