function addGoogleAnalytics()
{
	var code = "";
	code  += "(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){\n";
	code  += "(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),\n";
	code  += "m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)\n";
	code  += "})(window,document,'script','//www.google-analytics.com/analytics.js','ga');\n";
	code  += "\n";
	code  += "ga('create', 'UA-48456977-1', 'junewong.com');\n";
	code  += "ga('send', 'pageview');\n";

	var script = document.createElement('script');
	script.innerHTML = code;

	var  body = document.getElementsByTagName('body')[0];
	body.appendChild(script);
}

// Google analytics:
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-48456977-1', 'junewong.com');
ga('send', 'pageview');
