/**
 * import some js file:
 * 
 * @param uri $uri 
 * @param prefix $prefix : default is 'js/';
 * @return void
 */
function include(uri, prefix)
{
	prefix = prefix || 'js/';
	var src = prefix + uri;
	var sid = src.replace(/(\/|\.)/g, "_");
	if (id(sid)) 
		return; // if it had included.

	if (!this._thisScript) {
		// this script file node:
		var scripts = document.getElementsByTagName('script');
		this._thisScript = scripts[scripts.length-1];
	}

	var script = document.createElement('script');
	script.id = sid;
	script.type = 'text/javascript';
	script.src = src;
	this._thisScript.parentNode.insertBefore(script, this._thisScript);
}

function id(id) 
{
	return document.getElementById ? document.getElementById(id) : null;
}

function className(className, parentElement){
	var elems = (id(parentElement)||document.body).getElementsByTagName("*");
	var result=[];
	for (i=0; j=elems[i]; i++){
	  if ((" "+j.className+" ").indexOf(" "+className+" ") != -1){
	   result.push(j);
	  }
	}
	return result;
} 

function moveDom(targetDom, toDom)
{
	var node = typeof(targetDom) == 'string' ? id(targetDom) : targetDom;
	var parentNode = typeof(toDom) == 'string' ? id(toDom) : toDom;
	parentNode.appendChild(node.parentNode.removeChild(node));
}

function insertAfter(newEl, targetEl)
{
	var parentEl = targetEl.parentNode;
	if(parentEl.lastChild == targetEl) {
		parentEl.appendChild(newEl);
	}else {
		parentEl.insertBefore(newEl,targetEl.nextSibling);
	}            
}

function isElementNode(node)
{
	return node && node.nodeType && node.nodeType != 3;
}



window.onload = function()
{
	include('main.js');
}
