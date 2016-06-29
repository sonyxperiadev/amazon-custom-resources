#!/bin/bash

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

template=$current_dir/test-stack.template

$current_dir/../test-stack.sh $template
