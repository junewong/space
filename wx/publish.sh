#!/bin/bash

dir=$(dirname "$0")
path=$(realpath $dir)
echo "cd $path"
cd $path

echo "try to publish ..."
echo "pulling ..."
git pull ;
echo "adding ..."
git add . ;
echo "commiting ..."
git commit -a -m "update weixin articles" ;
echo "pushing ..."
git push ;
echo "Done"
