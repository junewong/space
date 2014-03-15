// for bootstrap style:
$(document).ready(function(){

	$('#contents h1').addClass('text-primary').addClass("page-header");
	$('#contents h2').addClass("page-header");
	$('#contents img').addClass("img-responsive");
	$('#contents em').addClass("text-muted");

	$('#menu').bind('DOMNodeInserted', function(e) {
		$('#menu > ul').addClass('list-group');
		$('#menu > ul > li').addClass('list-group-item');
		$('#contents').scrollspy({target: '#menu'});
	});
});

