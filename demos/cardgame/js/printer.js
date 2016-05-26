process.stdin.resume();
process.stdin.setEncoding('utf8');
var singleLog = require('single-line-log').stdout;

global.log = console.log;

/**
 * log like a printer.
 */
function printer( text, callback, speed ) {
	speed = speed || 40;
	var arr = text.split( '' );

	var str = '';
	for ( var i in arr ) {
		( function( text ) {
			setTimeout( function() {
				singleLog( text );
			}, i * speed );
		})( str += arr[i] );
	}

	setTimeout( function() {
		console.log();
		if ( callback ) {
			callback();
		}
		//process.exit();
	}, arr.length * speed );
}


/*
// Test
printer( 'Here is the printer test!', function() {
	console.log( 'Done' );
	process.exit();
});
*/

if ( exports ) {
	exports.printer = printer;
}
