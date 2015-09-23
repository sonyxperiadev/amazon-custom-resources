#!/bin/bash
current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

func='lambdaWithConfig'
event_script="$current_dir/event.json.sh"
param=${1:-"lambda-with-config-support"}

$current_dir/../invoke-lambda.sh $func $event_script $param
