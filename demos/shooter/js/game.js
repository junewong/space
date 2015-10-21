// define:
var CANVAS_WIDTH = window.innerWidth -20 ||  900;
var CANVAS_HEIGHT = window.innerHeight -20 || 420;
//var CANVAS_WIDTH = 900;
//var CANVAS_HEIGHT = 420;

var TILE_SIZE = 10;


var log = function( text ) {
	// pass;
};

/**
 * 游戏对象
 */
var Game = {

	init : function( components, callback ) {
		var battleMap = new Map( 10, CANVAS_WIDTH, CANVAS_HEIGHT );
		this.battleMap = battleMap;

		console.log( 'try to init, canvas width:' + CANVAS_WIDTH + ', height:' + CANVAS_HEIGHT  );

		Crafty.init( CANVAS_WIDTH, CANVAS_HEIGHT );
		Crafty.background( 'rgb(245,245,245)' );

		if ( ! components ) {
			return;
		}

		var array = components.replace( /\s+/g, '' ).split( ',' );
		for ( var i in array ) {
			var name = array[ i ], args;
			console.log( 'try to init component : ' + name );
			if ( name.indexOf( ':' ) > -1 ) {
				var p = name.split( ':' );
				args = [ p[1] ];
				name = p[0];
			}
			var component = this[ name ];
			component.apply( this, args );
		}

		Crafty.bind( 'KeyDown', function( e ) {
			if ( e.keyCode === 27 ) {
				Crafty.pause();
				console.log( 'Game pause: ' + Crafty.isPaused() );
			}
		});

		if ( callback ) {
			callback();
		}

	},

	mouse : function() {
		// 增加鼠标事件
		Crafty.e( '2D, Canvas, Color, Mouse' )
			.attr( {w: CANVAS_WIDTH, h:CANVAS_HEIGHT, alpha:0} )
			.bind( 'Click', function( e ) {
				Crafty.trigger( 'CanvasMouseClick', e );
			})
			.bind( 'DoubleClick', function( e ) {
				console.log( e.clientX + ' : ' + e.clientY );
				Crafty.trigger( 'CanvasMouseDbClick', e );
			})
			.bind('MouseUp', function( e ) {
				if( e.mouseButton == Crafty.mouseButtons.RIGHT ) {
					Crafty.trigger( 'CanvasMouseRightClick', e );
				}
			});
	},

	rock : function( count ) {
		count = count || 6;

		randomCreateEntity( count, this.battleMap, function( i ) {
			return Crafty.e( 'Rock' )
						.color( 'black' );

		});
	},

	wall : function( maxCount ) {
		maxCount = parseInt( maxCount || 10 );

		var wallCount = randInt(1, maxCount );

		randomCreateEntity( wallCount, this.battleMap, function( i ) {
			var w = randInt(1,  5 ) * 20;
			var h = randInt(1,  5 ) * 20;

			return Crafty.e( 'Wall' )
						.attr({ w:w, h:h } );

		});
	},

	ball : function( count ) {
		count = count || 6;

		randomCreateEntity( count, this.battleMap, function( i ) {
			return Crafty.e("Ball");

		});
	},

	weaponPill : function( count ) {
		count = count || 6;

		randomCreateEntity( count, this.battleMap, function( i ) {
			var k = randInt( 0, WEAPON_LIST.length -1 );

			var weaponClass = WEAPON_LIST[ k ];
			var color  = WEAPON_COLOS[ k ];

			var pill = Crafty.e("WeaponPill");

			pill.setWeapon( weaponClass );
			pill.setWeaponColor( color );

			return pill;

		});
	},

	_createSoldier : function( count ) {
		randomCreateEntity( count, null, function( i ) {
			return Crafty.e("Soldier")
						.color( 'purple' );

		});
	},

	soldier: function( count ) {
		// 多少个战士
		this.soldierCount = parseInt( count || 6 );

		this._createSoldier( this.soldierCount );

	},

	_createPlayer : function () {
		var pos = randPosition();
		Crafty.e("Player")
			.attr({ x: pos.x, y: pos.y } );
	},

	player : function() {
		// 创建玩家
		this._createPlayer();

	},

	skill : function() {
		Crafty( 'Player' ).each( function() {
			this.addSkill( SKILL_LIST[0] ); 
		});
	},

	revival : function() {
		var _this = this;

		// 复活 
		Crafty.bind( 'Dead', function( entity ) {
			if ( entity.has( 'Soldier' ) ) {
				setTimeout( function() {
					if ( Crafty( 'Soldier' ).length <  _this.soldierCount ) {
						_this._createSoldier( 1 );
					}
				}, 1000 );
			}

			if ( entity.has( 'Player' ) ) {
				setTimeout( function() {
					if ( Crafty( 'Player' ).length <  1 ) {
						_this._createPlayer();
					}
				}, 1000 );
			}
		});
	},

	shootButton  : function() {

		// 射击按钮
		Crafty.e( '2D, DOM, Color, Mouse' )
			.attr( {x: CANVAS_WIDTH - 100, y: CANVAS_HEIGHT - 100, w: 50, h:50, alpha:0.6} )
			.css( 'border-radius', 30 )
			.css( 'border', '4px solid gray' )
			.color( 'black' )
			.bind( 'MouseDown', function( e ) {
				this.attr( {alpha: 1.0} );
				Crafty.trigger( 'ShootButtonDown', e );
				return false;
			})
			.bind( 'MouseUp', function( e ) {
				this.attr( {alpha: 0.6} );
				Crafty.trigger( 'ShootButtonUp', e );
				return false;
			});

	},

	lowFPS : function() {
		Crafty.timer.FPS( 15 );
	},

	logger : function() {
		log =  function( text ) {
			console.log( text );
		};
	},

	_printFsmStates : function() {
		Crafty( 'Soldier' ).each( function( i ) {
			console.log( 'index:' + i + ' id:' + this.getId() + ' x:' + this.x + ' y:' + this.y + ' current state:' + this.fsm.current  );
		});
	}
};
