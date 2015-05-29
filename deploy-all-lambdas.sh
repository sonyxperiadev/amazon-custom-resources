#!/bin/bash

for f in */deploy-lambda.sh; do
  (cd $(dirname $f) && ./deploy-lambda.sh)
done


