#!/bin/bash
current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

func='route53Dependency'
event_script="$current_dir/event.json.sh"
param=${1:-"lifelog-dev.sonymobile.com"}

$current_dir/../invoke-lambda.sh $func $event_script $param
