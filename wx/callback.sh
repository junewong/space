#!/bin/bash

dir=$(dirname "$0")
path=$(realpath $dir)

cd $path

echo "cd to path: " `pwd`

./mklist.sh > ./list.html;

echo "try to call publish.sh ..."
./publish.sh
