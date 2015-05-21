#!/bin/bash

template="./elasticache-dependency-role.template"
stack_name='elasticache-dependency-support'

../create-role.sh $stack_name $template
