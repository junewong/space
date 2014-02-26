var Url = {
	params : "",
	paths : [],

	filename : function() {
		   return /[^\/]+(#|$)/.exec(location.pathname)[0];
	},

	filepath: function() {
		  return location.href.replace(/[^\/]+$/, '');
	},

	_convert : function() {
		this.params = {};
		var all = location.search.replace(/^\?/, '').split("&");
		for (var i in all) {
			var a = all[i].split("=");
			this.params[a[0]] = a[1];
		}
	},

	value : function(key) {
		if (this.params === "") {
			if (location.search.indexOf("?") < 0)
			   	return "";
			this._convert();
		}
		return this.params[key];
	},

	pushPath : function(oldPaths, newPath) {
	   if (oldPaths) {
		   this.paths = oldPaths.split("|");
	   }
	   this.paths.push(newPath);
	},

	getPathValue : function() {
	   return this.paths.join("|");
	},

	decode : function(url) {
		return  decodeURI(url);
	},

	getNames : function() {
		var result = [];
		for (var i in this.paths) {
			result.push( this.decode(this.paths[i].replace(/\.\w+$/, '')) );
		}
		return result;
	}

}
