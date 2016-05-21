/**
 * 流程控制
 */
var process;

( function( ps ) {

	var stack = [];

	ps = {

		isEnd: function() {
			return stack.length === 0;
		},

		then : function( callback ) {
			stack.push( callback );
			return ps;
		},

		done : function() {
			var callback = stack.pop();
			if ( callback ) {
				callback();
			}
			return ps;
		}
	};


})( process );
