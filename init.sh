#!/bin/bash

for pkg in */package.json; do
  name=`dirname $pkg`
  echo "Initializing $name..."
  (cd $name && npm install)
  echo "Done!"
done
