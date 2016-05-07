var InfoBar = {
	_scoreBar : null,

	init : function() {
		this.initScoreBar();
	},

	initScoreBar : function() {
		var padding_left = 4, padding_top = 4;

		if ( ! this._scoreBar ) {
			this._scoreBar = Crafty.e( '2D, Canvas, Color, Tween, Text' )
				.attr( {x:padding_left, y:padding_top, w:CANVAS_WIDTH, h:40 } )
				.textFont( { size: '14px' } );
		}
	},

	updateScores : function() {
		if ( ! this._scoreBar ) {
			return;
		}

		this.changeZIndex();

		new Flash( this._scoreBar, {count:1, time:800} );

		var list = [];
		Crafty( 'Player, Soldier' ).each( function() {
			var item = this.name + '[' + this.level + ']' + '：'  + this.getScore();
			list.push( item );
		});

		var text = list.sort().join( '    ' );
		this._scoreBar.text( text );
	},

	changeZIndex : function() {
		if ( this._scoreBar ) {
			this._scoreBar.attr( {z : this._globalZ + 1} );
		}

	},

};
