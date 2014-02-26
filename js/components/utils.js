//==== out put someting: ====
function print(text)
{
	document.write((text || '') + "<br/>");
}

function hr()
{
	document.write("<hr/>");
}


//==== extend Array ====
Array.prototype.each = function(callback) {
	for (var i=0; i<this.length; i++) {
		callback(this[i], i);
	}
};


//==== extend Number ====
Number.prototype.times = function(callback) {
	var count = this;
	for (var i=0; i<count; i++) {
		callback(i+1);
	}
}
