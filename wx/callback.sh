#!/bin/bash

dir=$(dirname "$0")
path=$(realpath $dir)

cd $path

./mklist.sh > ./list.html;
./publish.sh
