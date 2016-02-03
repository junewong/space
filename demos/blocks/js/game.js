var size = 40, w_size = 7, h_size = 7;
var INFO_HEIGHT = 30;
var CONTROL_WIDTH = size * w_size;
var CONTROL_HEIGHT = size * h_size;
var CANVAS_WIDTH = CONTROL_WIDTH;
var CANVAS_HEIGHT = CONTROL_HEIGHT + INFO_HEIGHT;
var MIN_BLOCK = 2;
var BORDER_COLOR = 'black';

var colors = [ 'red', 'orange', 'purple', 'green', 'blue' ];

Crafty.init( CANVAS_WIDTH, CANVAS_HEIGHT, document.getElementById( 'stage' ) );

Crafty.stage.elem.style.border = "12px solid " + BORDER_COLOR;

Crafty.c( "Ostacle" );

Crafty.c( "Platform", {
	init: function( config ) {
		this.requires( 'Ostacle, 2D, DOM, Color' );
		this.attr({ w: CONTROL_WIDTH, h: 1 })
			.color("black");
	}
});

Crafty.c( "Block", {
	init: function( config ) {
		var _this = this;

		this.requires("Ostacle, 2D, DOM, Color, Gravity, Touch, Mouse")
			.color("red")
			.attr({ w: size, h: size })
			.css( "border", "1px solid white" )
			.gravityConst( 1.5 )
			.gravity( "Ostacle" );

		this.bind('MouseUp', function() {
				clean( _this );
				//_this.destroy();
			});

	}
});

function randomColor() {
	var i = Crafty.math.randomInt( 0, colors.length-1 );
	return colors[i];
}

function find( entity, name ) {
	var x = entity.x, y = entity.y;

	if ( name == 'left' ) {
		x -= size;

	} else if ( name == 'right' ) {
		x += size;

	} else if ( name == 'up' ) {
		y -= size;

	} else if ( name == 'down' ) {
		y += size;
	}

	if ( x < 0 || x > CONTROL_WIDTH) {
		return null;
	}

	if ( y < 0 || y > CONTROL_HEIGHT ) {
		return null;
	}

	//var list = Crafty.map.search( {x:x, y:y, w:size, h:size}, false );
	//return list && list.length > 0 ? list[0] : null;
	var block = searchBlock( x, y );
	return block;
}

function searchBlock( x, y ) {
	var list = Crafty( 'Block' );
	for (var i = 0, len = list.length; i < len; i++) {
		var o = list.get( i );
		if ( x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h ) {
			return o;
		}
	}
	return null;
}

function findAll( entity, result, last ) {
	if ( ! entity ) {
		return result;
	}

	var four = ['left', 'up', 'right', 'down'];
	for ( var i in  four ) {
		if ( last && Math.abs( four.indexOf( last ) - i ) == 2 ) {
			continue;
		}
		var nearby = find( entity, four[i] );
		if ( nearby && nearby.color() == entity.color() ) {
			if ( result.indexOf( nearby ) === -1 ) {
				result.push( nearby );
				findAll( nearby, result, four[i] );
			}
		}
	}
	return result;
}

function clean( entity ) {
	var result = [ entity ];
	findAll( entity, result );
	if  ( result.length >= MIN_BLOCK ) {
		var columns = [], total = result.length;
		for ( var j = 0; j < w_size; columns[j] = 0, j++ );

		for ( var i in result ) {
			columns[ result[i].column ] ++;
			result[i].destroy();
		}

		addScore( total );

		setTimeout( function() {
			var offset = 0;
			while ( total > 0 ) {
				for ( var i = 0; i < w_size; i++ ) {
					if ( columns[i] ) {
						dropOne( i, offset );
						columns[i] --;
						total --;
					}
				}
				offset += 150;
			}
		}, 300 );
	}
}

function dropOne( i, offset ) {
	var time = Crafty.math.randomInt( 0, 50 ) + ( offset || 0 );
	setTimeout( function() {
		var block = Crafty.e("Block").attr( {x: i * size, y:0} ).color( randomColor() );
		block.column = i;
	}, time );
}

function addRow() {
	for ( var i = 0; i < w_size; i++ ) {
		dropOne( i );
	}
}

function addScore( blockTotal ) {
	var score = blockTotal;
	if ( blockTotal == 4 ) {
		blockTotal += 1;
	} else if ( blockTotal >= 5 ) {
		blockTotal += 2;
	}

	totalScore += score;
	info.text( '分数：' + totalScore );
}

Crafty.e( "Platform" ).attr( {x: 0, y:CANVAS_HEIGHT - 2} );

var totalScore = 0;
var info = Crafty.e( '2D,DOM,Text' )
		.attr( {x:0, y:0, w:CONTROL_WIDTH, h:INFO_HEIGHT} )
		.css( {"color": "white"} )
		.css( {"font-size": "200%", "font-weight": "bold"} )
		.css( {"background-color": BORDER_COLOR } )
		.text( '分数：' + totalScore );

for ( var i = 0; i < h_size; i ++ ) {
	setTimeout( addRow, i * 300 );
}

