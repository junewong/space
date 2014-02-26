/**
 * 调整页面结构：
 * 1.将h1、h2、h3...等标题下面的内容合并到一个div中 
 */

//=== public ===

function makeAllConetentAsBlock(parentNode)
{
	if (!parentNode) return;
	var allTitleDom = findAllTitleDomInContent(parentNode);
	for (var i in allTitleDom) {
		var titleNode = allTitleDom[i];
		makeContentAsBlockForTitleDom(titleNode);
	}
}


function makeContentAsBlockForTitleDom(titleNode)
{
	var allContentDom = findAllContentDomForTitleDom(titleNode);
	var idStr = getContentIdWithTitleId(titleNode.id);
	var div = creatWrapDivForContentWithId(idStr);
	moveAllContentIntoDom(allContentDom, div);
	insertAfter(div, titleNode);
}

//=== private ===

function findAllTitleDomInContent(parentNode)
{
	var childNodes = parentNode.childNodes;
	var allNodes = [];
	for (var i in childNodes) {
		var node = childNodes[i];
		if (isTitleNode(node)) {
			allNodes.push(node);
		}
	}
	return allNodes;
}

function getContentIdWithTitleId(titleId)
{
	return "content-" + titleId;
}

function isTitleNode(node)
{
	return /\bH[0-9]+\b/i.test(node.tagName);
}

function findAllContentDomForTitleDom(titleNode)
{
	var allNodes = [];
	var currentNode = titleNode;
	while(currentNode = currentNode.nextSibling) {
		if (isTitleNode(currentNode)) break;
		allNodes.push(currentNode);
	}
	return allNodes;
}


function creatWrapDivForContentWithId(idStr)
{
	var div = document.createElement('div');
	div.id = idStr;
	return div;
}


function moveAllContentIntoDom(allContentDom, div)
{
	for (var i in allContentDom) {
		var dom = allContentDom[i];
		moveDom(dom, div);
	}
}


// make:
makeAllConetentAsBlock(id('contents'));

