/**
 * 流程控制
 */
var process;

( function( ps ) {

	var stack = [];

	ps = {
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
