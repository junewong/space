/**
 * This file is the entrance for any other functions.
 * We can include anything we want.
 */

// node:
if ( require ) {
	var Process = require( 'Process.js' ).Process;
	var printer = require( 'printer.js' ).printer;


} else {
// html:
	include('../../common/base.js');
	include('Process.js');
}
