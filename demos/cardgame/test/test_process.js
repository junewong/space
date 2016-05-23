process.stdin.resume();
process.stdin.setEncoding('utf8');
var util = require('util');
var singleLog = require('single-line-log').stdout;

var Process = require( 'Process.js' ).Process;
var printer = require( 'printer.js' ).printer;

var log = console.log;

log('--- Start --- ');


log( Process );

var ps = new Process();

ps.then( function() {
	log( 'then 1' );
	ps.then( function() {
		log( 'then 2' );
		ps.then( function() {
			log( 'then 3' );
		});
	});
});

while ( ! ps.isEnd() ) {
	ps.done();
}


var player = function() {
	ps.then( function() {
		printer( 'player is start animation ...', function() {
			ps.done();
		});
	});
	printer( 'player is playing now ...', function() {
		log( 'get input:' );
		process.stdin.on('data', function (text) {
			log('received data:', util.inspect(text));
			ps.done();
		});
	});

};
var enemy = function() {
	printer( 'enemy is playing now ...', function() {
		ps.done();
	});
};

var count = 3;
var game = function() {
	log( 'game left count: ' + count );
	if ( count == 0 ) {
		process.exit();
		return;
	}

	ps.then( function() {
		game();
	});

	ps.then( function() {
		printer( 'game try to call enemy...', function() {
			enemy();
		});
	});

	ps.then( function() {
		printer( 'game try to call player...', function() {
			player();
		});
	});

	count --;
	ps.done();

};

game();

log('--- End --- ');
