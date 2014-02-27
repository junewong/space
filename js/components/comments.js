var idcomments_acct = 'd48144365db9bba105f9fef89c5cd254';
var idcomments_post_id;
var idcomments_post_url;

function createCommentsPanel()
{
	var div = id('comments');

	var panel = document.createElement('span');
	panel.id = "IDCommentsPostTitle";
	panel.style = "display:none";
	div.appendChild(panel);

	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = "http://www.intensedebate.com/js/genericCommentWrapperV2.js";
	div.appendChild(script);
}

createCommentsPanel();
