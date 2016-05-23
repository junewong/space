/**
 * import some js file:
 * 
 * @param uri $uri 
 * @param prefix $prefix : default is 'js/';
 * @param uri $callback : the callback function when loaded; 
 * @return void
 */

function include(uri, prefix, callback)
{
	var isCss = /\.\bcss\b/i.test(uri); // js or css
	prefix = prefix || 'js/';
	var src = /^http/.test(uri) ? uri : prefix + uri;
	var sid = src.replace(/(\/|\.)/g, "_");
	if (id(sid)) 
		return; // if it had included.

	if (!this._thisScript) {
		// this script file node:
		var scripts = 
			   document.getElementsByTagName('head')[0].getElementsByTagName('script') ||
			   document.getElementsByTagName('script');
		this._thisScript = scripts[scripts.length-1];
	}

	// create DOM:
	var dom;
	if (!isCss) {
		var script = document.createElement('script');
		script.id = sid;
		script.type = 'text/javascript';
		script.src = src;
		dom = script;
	} else {
		var link = document.createElement('link');
		link.id = sid;
		link.rel = 'stylesheet';
		link.href = src;
		dom = link;
	}

	// callback if need:
	if (callback) {
		dom.onload = dom.onreadystatechange = function() {
			if (!this.readyState || 'loaded' === this.readyState || 'complete' === this.readyState) {
				//alert("com: " + componentId + " callback:" + callback);///
				callback();
				this.onload = this.onreadystatechange = null;
			}
		};
		// firefox:
		dom.addEventListener('load', callback, false);
	}

	this._thisScript.parentNode.insertBefore(dom, this._thisScript);
}

function id(sid) 
{
	return document.getElementById ? document.getElementById(sid) : null;
}

function className(aClassName, parentElement){
	var elems = (id(parentElement)||document.body).getElementsByTagName("*");
	var result=[];
	for (i=0; i<elems.length; i++){
		var j=elems[i];
		if ((" "+j.className+" ").indexOf(" "+aClassName+" ") != -1){
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
};
