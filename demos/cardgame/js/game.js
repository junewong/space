if ( require ) {
	require( 'main.js' );
	for ( var i in global ) {
		this[i] = global[i];
		//console.log( 'load global vairable: ' + i );
	}
}


var Game = {

	step : 0,

	actors : [],

	init : function() {
		var ai = new AIPlayer();
		var player = new Player();

		this.actors = [ai, player];

		step = 0;
	},

	run : function() {
		var _this = this;
		step ++;

		if ( _this.isEnd() ) {
			log( '=== END ===' );
			process.exit();
			return;
		}

		ps.then( function() {
			_this.run();
		});

		for ( var i in _this.actors ) {
			(function( i ) {
				ps.then( function() {
					var actor = _this.actors[i];
					var message = "Now it's '{0}' order ... ".format( actor.name );
					printer( message, function() {
						actor.run();
					});
				});
			})( i );
		}

		log( '--- Game step: ' + step + ' ----' );
		ps.done();
	},

	_count : 3,
	isEnd : function() {
		this._count --;
		return this._count < 0;
	}
};

if ( exports ) {
	exports.Game = Game;
}
