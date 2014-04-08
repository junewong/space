/**
 * This file is the entrance for any other functions.
 * We can include anything we want.
 */
//include('libs/jquery.min.js');
//include("components/url.js");
include('components/sliderbar.js');
//include('components/navigation.js');
//include('components/content.js');
//include('components/folder.js');
include('components/style.js');
include('http://highlightjs.org/static/styles/railscasts.css');
include('http://highlightjs.org/static/highlight.pack.js', '', function() {
	$('#contents pre').each(function(i, e) {hljs.highlightBlock(e)});
});
include('components/comments.js');
include('components/analytics.js');
