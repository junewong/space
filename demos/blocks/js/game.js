var canvas_is_inited = false;

var Player = function( options ) {

	var death = false;

	var size = 40, w_size = 7, h_size = 7;

	var INFO_HEIGHT = 30;

	var CONTROL_WIDTH = size * w_size;
	var CONTROL_HEIGHT = size * h_size;

	var BORDER_SIZE = 12;
	var BORDER_COLOR = 'lightgray';
	var BORDER_HIGHLIGHT_COLOR = 'orange';

	var OFFSET_X = BORDER_SIZE + ( options.offsetX || 0);
	var OFFSET_Y = BORDER_SIZE + ( options.offsetY || 0);

	var PLAY_AREA_WIDTH = CONTROL_WIDTH + BORDER_SIZE *2 + ( OFFSET_X - BORDER_SIZE );
	var PLAY_AREA_HEIGHT = CONTROL_HEIGHT + INFO_HEIGHT + BORDER_SIZE *2;

	var CANVAS_WIDTH = PLAY_AREA_WIDTH * 3 + BORDER_SIZE * 3 ;
	var CANVAS_HEIGHT = PLAY_AREA_HEIGHT + OFFSET_Y;

	var MIN_BLOCK = 2;

	var BLOCK_NAME = 'Block' + ( options.id || Math.random() * 10000 );

	var LOCKING = options.lock || false;

	var colors = [ 'red', 'orange', 'purple', 'green', 'blue' ];

	var totalScore = 0, lastScore = 0, lastProfix = 0, money = options.moeny || w_size * h_size * 100;

	if ( ! canvas_is_inited ) {
		Crafty.init( CANVAS_WIDTH, CANVAS_HEIGHT, document.getElementById( 'stage' ) );
		canvas_is_inited = true;
	}

	//Crafty.stage.elem.style.border = "12px solid " + BORDER_COLOR;

	Crafty.c( "Ostacle" );

	Crafty.c( "Platform", {
		init: function( config ) {
			this.requires( 'Ostacle, 2D, Canvas, Color' );
			this.attr({ w: CONTROL_WIDTH, h: 1 })
				.color( BORDER_COLOR );
		}
	});

	Crafty.c( BLOCK_NAME, {
		init: function( config ) {
			var _this = this;

			this.requires("Ostacle, 2D, Canvas, Color, Gravity, Mouse")
				.attr({ w: size, h: size })
				//.css( "border", "1px solid white" )
				.gravityConst( 1.5 )
				.gravity( "Ostacle" );

			var bs = 1;
			//this.block = Crafty.e( '2D, Canvas, Color, Mouse' ).attr( {x:bs, y:bs, w:this.w - bs*2, h: this.h - bs*2 } );
			//this.attach( this.block );

			this.bind( 'MouseUp', function() {
				if ( ! LOCKING ) {
					if ( clean( _this ) ) {
						if ( options.autoLock ) {
							LOCKING = true;
						}
					}
				}
			});
		},

		setColor : function( color ) {
			//this.block.color( color );
			this.color( color );
			return this;
		}
	});

	function generateColor() {
		return options.generate? options.generate() :  randomColor();
	}

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

		if ( x < OFFSET_X || x > OFFSET_X + CONTROL_WIDTH) {
			return null;
		}

		if ( y < OFFSET_Y || y > OFFSET_Y + CONTROL_HEIGHT ) {
			return null;
		}

		//var list = Crafty.map.search( {x:x, y:y, w:size, h:size}, false );
		//return list && list.length > 0 ? list[0] : null;
		var block = searchBlock( x, y );
		return block;
	}

	function searchBlock( x, y ) {
		var list = Crafty( BLOCK_NAME );
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

			// 消除方块
			for ( var i in result ) {
				columns[ result[i].column ] ++;
				result[i].destroy();
			}

			// 分数
			addScore( total );

			var data = {color: entity.colorName, count: total, score: lastScore};

			// 资金
			if ( options.market ) {
				var profix = options.market.getProfix( data );
				lastProfix = profix;
				money += profix;
				var tip = profix < 0 ? profix : '+' + profix;
				showTip( tip );
				if ( money <= 0 ) {
					death = true;
				}
			}

			info.text( descScore() );

			// 补充缺失的方块
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
				setTimeout( function() {
					Crafty.trigger( 'CleanDone', data );
				}, options.delay || 0 );
			}, 300 );
			return true;
		}
		return false;
	}

	function dropOne( i, offset ) {
		var time = Crafty.math.randomInt( 0, 50 ) + ( offset || 0 );
		setTimeout( function() {
			var color = generateColor();
			var block = Crafty.e( BLOCK_NAME ).attr( {x: OFFSET_X + i * size, y:OFFSET_Y} ).setColor( color );
			block.colorName = color;
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
		/*
		if ( blockTotal == 4 ) {
			score += 1;
		} else if ( blockTotal >= 5 ) {
			score += 2;
		}
		*/
		if ( blockTotal >= 5 ) {
			score += 1;
		}

		lastScore = score;
		totalScore += score;
	}

	function autoClick() {
		if ( autoClickRandom() ) {
			return true;
		} else {
			console.log( 'try to click all!' );
			return autoClickAll();
		}
	}

	function autoClickRandom() {
		var blocks = Crafty( BLOCK_NAME ), i, len; i = len = blocks.length;
		var maxBlock, maxTotal = 0;
		while( --i > 0 ) {
			var block = blocks.get( Crafty.math.randomInt( 0, len - 1 ) );
			var total = findAll( block, [ block ] ).length;
			if ( total > 1 && total > maxTotal ) {
				maxTotal = total;
				maxBlock = block;
			}
		}
		if ( maxBlock ) {
			clean( maxBlock );
			return true;
		}
		return false;
	}

	function autoClickAll() {
		var blocks = Crafty( BLOCK_NAME ), i = blocks.length;
		while( --i > 0 ) {
			var block = blocks.get( i );
			if ( clean( block )  ) {
				return true;
			}
		}
		return false;
	}

	function descScore() {
		 var desc = options.market ? 
						 '资金：' + money + ' 最近利润：' + lastProfix +  '  分数：' + totalScore + '  最近得分：' + lastScore :
						 '分数：' + totalScore + '  最近：' + lastScore;
		 return desc;
	}

	function showTip( tip ) {
		var x = OFFSET_X - BORDER_SIZE + PLAY_AREA_WIDTH / 2 - 20;
		var y = OFFSET_Y - BORDER_SIZE + PLAY_AREA_HEIGHT / 2 - 120;
		var color = /^\+/.test( tip ) ? 'red' : 'green';
		Crafty.e( '2D, Canvas, Text, Tween' ).attr( {x:x, y:y} )
			.textFont( { size: '24px', weight: 'bold' } )
			.textColor( color )
			.text( tip )
			.tween( {y : y - 60, alpah: 0}, 500 )
			.bind( 'TweenEnd', function() {
				this.destroy();
			});
	}

	var background = Crafty.e( "2D, Canvas, Color" )
		.attr({x: OFFSET_X - BORDER_SIZE , y:OFFSET_Y - BORDER_SIZE, w:PLAY_AREA_WIDTH, h:PLAY_AREA_HEIGHT })
		.color( BORDER_COLOR );

	Crafty.e( "2D, Canvas, Color" )
		.attr({x: OFFSET_X , y:OFFSET_Y, w:CONTROL_WIDTH, h:CONTROL_HEIGHT })
		.color( BORDER_COLOR );

	Crafty.e( "Platform" ).attr( {x: OFFSET_X - BORDER_SIZE, y: OFFSET_Y - BORDER_SIZE + PLAY_AREA_HEIGHT - BORDER_SIZE - 2} );

	var info = Crafty.e( '2D,Canvas,Text' )
			.attr( {x:OFFSET_X, y:OFFSET_Y, w:CONTROL_WIDTH, h:INFO_HEIGHT} )
			//.css( {"color": "black"} )
			//.css( {"padding-top": "2px", "padding-left": "2px"} )
			//.css( {"font-size": "200%", "font-weight": "bold"} )
			//.css( {"background-color": BORDER_COLOR } )
			.text( descScore() );

	for ( var i = 0; i < h_size; i ++ ) {
		setTimeout( addRow, i * 300 );
	}

	this.getId = function() {
		return options.id;
	};

	this.isAI = function() {
		return !! options.isAI;
	};

	this.next = function() {
		autoClick();
	};

	this.lock = function() {
		LOCKING = true;
	};

	this.unlock = function() {
		LOCKING = false;
	};

	this.highlight = function() {
		background.color( BORDER_HIGHLIGHT_COLOR );
	};

	this.unhighlight = function() {
		background.color( BORDER_COLOR );
	};

	this.isDead = function() {
		return death;
	};

}; //END Player

