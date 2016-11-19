#!/bin/bash

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
