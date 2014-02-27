// for bootstrap style:
$(document).ready(function(){

	$('h1').addClass('text-primary').addClass("page-header");
	$('h2').addClass("page-header");
	$('#menu').find('ul').addClass('list-group');
	$('#menu > ul > li').addClass('list-group-item');
	$('#contents').scrollspy({target: '#menu'});
});
