#! /bin/bash

dir=$(dirname "$0")
path=$(realpath $dir)

cd $path

echo '
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta id="viewport" name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
	<title>历史文章列表</title>
	<style>
	a {
		color:dodgerblue;
		font-size:14px;
		font-weight:bold;
		text-decoration:none;
	}
	p {
		line-height: 14px;
	}
	</style>
</head>
<body>
'

find . -name "*.html" |sed "s#./##" |grep -E "[0-9]{4}-[0-9]{2}-" |sort -nr |while read file
do
	echo "<p><a href='./$file'>$file</a></p>"
done


echo "
</body>
</html>
"

