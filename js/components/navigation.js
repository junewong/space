
var URL_KEY_PATHS = "paths";

function initUrlPaths()
{
	var key = URL_KEY_PATHS, value;
	var paths = Url.value(key);
	var filename = Url.filename();
	Url.pushPath(paths, filename);
}

function convertLinks()
{
	var key = URL_KEY_PATHS, value;
	value = Url.getPathValue();

	var links = id("contents").getElementsByTagName('a');
	for (var i in links) {
		var link = links[i].href;
		if (link && link.indexOf("/space/") > -1 && link.indexOf("#toc") == -1) {
			var url =  link + (link.indexOf("?") > -1 ? "&" : "?") + key + "=" + value;
			links[i].href = url;
		}
	}
}

function convertHeaderLink()
{
	var paths = Url.paths;
	var names = Url.getNames();
	if (paths.length == 0) return;
	var navNode = className("home", id("header"))[0];
	for (var i in paths) {
		if (/\bindex\b/.test(paths[i])) continue;// don't include index
		var li = document.createElement("li");
		if  (i == paths.length-1) li.className = "active";
		var html = '<a href="' + Url.filepath() + paths[i] + '">' +  names[i] +'</a>';
		li.innerHTML = html;
		navNode.appendChild(li);
	}
}

function addReturnLinkForMenu()
{
	var paths = Url.paths;
	if (paths.length <= 1) 
		return;
	var filepathName = paths[paths.length - 2];
	var node = document.createElement('div');
	node.className = "return";
	node.innerHTML = '<a href="' + Url.filepath() + filepathName +'">' + '<< 返回上一层' + '</a>';
	var menu = id('menu');
	menu.insertBefore(node, menu.firstChild);
}

initUrlPaths();
convertLinks();
convertHeaderLink();
addReturnLinkForMenu();
