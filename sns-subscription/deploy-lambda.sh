#!/bin/bash
#
# deploy-lambda.sh

func='snsSubscription'
role_stack_name='sns-subscription-support'

current_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
$current_dir/../deploy-lambda.sh $func $role_stack_name
