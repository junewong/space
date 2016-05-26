/**
 * This file is the entrance for any other functions.
 * We can include anything we want.
 */

// node:
if ( require ) {
	global.Process = require( 'Process.js' ).Process;

	var ps = new Process();
	global.ps = ps;

	global.printer = require( 'printer.js' ).printer;

	global.Class = require( 'common/class.js' ).Class;

	require( 'card.js' );
	require( 'actor.js' );

	var format = require( 'string-format' );
	format.extend( String.prototype, {} )


} else {
// html:
	include('../../common/base.js');
	include('Process.js');
}
