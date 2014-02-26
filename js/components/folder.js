/**
 *  folde a list with 'ul > li' in a div.
 */

//=== public function ===

function foldListWithParentNode(parentNode)
{
	var contentId = getContentIdWithTitleId(parentNode.id);
	hideFloderWithNode(id(contentId));
	setFlagForNodeIsFloded(parentNode, true);
}

function expandListWithParentNode(parentNode)
{
	var contentId = getContentIdWithTitleId(parentNode.id);
	showFolderWithNode(id(contentId));
	setFlagForNodeIsFloded(parentNode, false);
}

function isFoldedWithNode(node)
{
	return !!node.is_folded;
}

//=== private function ===

function isNeedToFolded(node) 
{
	return isElementNode(node) && node.tagName != 'UL';
}

function hideFloderWithNode(node) 
{
	if (node) {
		node.style.display = 'none';
	}
}

function showFolderWithNode(node)
{
	if (node) {
		node.style.display = '';
	}
}

function setFlagForNodeIsFloded(node, isFolded)
{
	node.is_folded = isFolded;
}

