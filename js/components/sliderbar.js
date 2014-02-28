// @require contents.js folder.js

//=== public ===

function moveMenuToRightBar()
{
	var from = className('toc', id('contents'))[0];
	var to = id('menu');
	if (from && from.childNodes.length > 0) {
		while (from.firstChild) {
			var node = from.removeChild(from.firstChild);
			to.appendChild(node);
		}
	}
}

function addFolderButtonsForMenu()
{
	var allNodes = findAllListNodeInMenu();
	for (var i in allNodes) {
		var node = allNodes[i];
		appendFloderButtonToNode(node);
	}
}

//=== private ===


function findAllListNodeInMenu()
{
	var menu = id('menu');
	var ul = menu.getElementsByTagName('UL')[0];
	var nodes = ul.getElementsByTagName('LI');
	/*
	var childNodes = ul.childNodes;
	var nodes = [];
	for (var i in childNodes) {
		var node = childNodes[i];
		if (isElementNode(node) && node.tagName == 'LI') {
			nodes.push(node);
		}
	}
	*/
	return nodes;
}

function appendFloderButtonToNode(node)
{
	var folderButton = createFolderButton();
	var titleId = getTitleIdFromMenuNode(node) || '';
	setTargetTitleIdForFolderButton(folderButton, titleId);
	node.appendChild(folderButton);
}

function createFolderButton()
{
	var span = document.createElement("span");
	span.className = "button-folder";
	span.innerHTML = "fold";
	span.onclick = clickedFolderButtonEvent;
	return span;
}

function clickedFolderButtonEvent(e)
{
	var buttonNode = e.target;
	var titleId = getTargetTitleIdForFolderButton(buttonNode);
	var titleNode = id(titleId);
	if (isFoldedWithNode(titleNode)) {
		expandListWithParentNode(titleNode);
	} else {
		foldListWithParentNode(titleNode);
	}
}

function getTitleIdFromMenuNode(node)
{
	if (!node) return;
	var aNode = node.firstChild;
	var id = aNode.href.replace(/^.*#/, '');
	return id;
}

function setTargetTitleIdForFolderButton(node, idStr)
{
	node.target_content_id = idStr;
}

function getTargetTitleIdForFolderButton(node)
{
	return node.target_content_id;
}


//=== active ===

moveMenuToRightBar();

//addFolderButtonsForMenu();
