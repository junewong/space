/**
 * 流程控制
 */
var Process = function() {
	this.stack = [];
};
Process.prototype = {

	isEnd: function() {
		return this.stack.length === 0;
	},

	then : function( callback ) {
		this.stack.push( callback );
		return this;
	},

	done : function() {
		var callback = this.stack.pop();
		if ( callback ) {
			callback();
		}
		return this;
	}
};

if ( exports ) {
	exports.Process = Process;
}
