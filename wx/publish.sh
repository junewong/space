#!/bin/bash

echo "try to publish ..."
git pull 
git add . 
git commit -a -m "update weixin articles" 
git push
echo "Done"
