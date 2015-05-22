#!/bin/bash

for f in */create-roles.sh; do
  $f
done

for f in */deploy-lambda.sh; do
  (cd $(dirname $f) && deploy-lambda.sh)
done

