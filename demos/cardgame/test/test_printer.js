global.printer = require( 'printer.js' ).printer;

for ( var i in global ) {
	this[i] = global[i];
	console.log( 'load global vairable: ' + i );
}

printer( 'abcdefghijklmn', function() {
	process.exit();
});

