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
		var _this = this;

		var battleMap = new Map( 10, CANVAS_WIDTH, CANVAS_HEIGHT );
		this.battleMap = battleMap;

		this._groupColors = [ 'orange', 'purple', 'RGB(15,121,222)', 'RGB(89,207,40)', 'pink', 'brown', 'blue' ];
		this._groupCount = 0;
		this._playerColor = 'RGB(216,110,22)';

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
			} else {
				args = null;
			}
			var component = this[ name ];
			component.apply( this, args );
		}

		Crafty.bind( 'KeyDown', function( e ) {
			// Esc:
			if ( e.keyCode === 27 ) {
				Crafty.pause();
				console.log( 'Game pause: ' + Crafty.isPaused() );
			}
		})
		.bind( 'CallServant', function( actor ) {
			_this._createServant( actor );
		});

		if ( callback ) {
			callback();
		}

	},

	mouse : function() {
		var pressTimer = null;

		// 增加鼠标事件
		Crafty.e( '2D, Canvas, Color, Mouse' )
			.attr( {w: CANVAS_WIDTH, h:CANVAS_HEIGHT, alpha:0} )
			.bind( 'Click', function( e ) {
				//Crafty.trigger( 'CanvasMouseClick', e );
			})
			.bind( 'DoubleClick', function( e ) {
				console.log( e.clientX + ' : ' + e.clientY );
				Crafty.trigger( 'CanvasMouseDbClick', e );
			})
			.bind('MouseDown', function( e ) {
				if( e.mouseButton == Crafty.mouseButtons.LEFT ) {
					pressTimer = setTimeout( function() {
						pressTimer = null;
						// 长按
						Crafty.trigger( 'CanvasMouseLongPressDown', e );
					}, 150 );
				}
			})
			.bind('MouseUp', function( e ) {
				// 鼠标右键
				if ( e.mouseButton == Crafty.mouseButtons.RIGHT ) {
					Crafty.trigger( 'CanvasMouseRightClick', e );

				// 鼠标左键
				} else {
					if ( pressTimer ) {
						clearTimeout( pressTimer );
						// 点击
						Crafty.trigger( 'CanvasMouseClick', e );
					} else {
						// 长按结束
						Crafty.trigger( 'CanvasMouseLongPressUp', e );
					}
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

	_createSoldier : function( count, group, color ) {
		var _this = this;

		randomCreateEntity( count, null, function( i ) {
			var actor = Crafty.e("Soldier");

			var index = 1;
			if ( group ) {
				index = group > _this._groupColors.length ? 1 : group;
			}

			color = color || _this._groupColors[ index ];
			actor.color( color );

			actor.group = group || actor.getId();
			return actor;

		});

		if ( this.shouldAddSkill ) {
			this.skill( 3, 'Soldier' );
		}
	},

	soldier: function( count ) {
		// 多少个战士
		this.soldierCount = parseInt( count || 6 );

		if ( this._groupCount && this._groupCount > 1 ) {
			for ( var i = 1; i <= this._groupCount -1; i++ ) {
				this._createSoldier( this.soldierCount, i );
			}

		} else {
			this._createSoldier( this.soldierCount );
		}

	},

	_getSoldierCount : function( group ) {
		if ( ! group ) {
			return Crafty( 'Soldier').length;

		} else {
			var count = 0;
			Crafty( 'Soldier' ).each( function() {
				if ( this.group === group ) {
					count ++;
				}
			});
			return count;
		}
	},

	_createPlayer : function ( group ) {
		var pos = randPosition();
		var player = Crafty.e("Player")
				.attr({ x: pos.x, y: pos.y } );

		player.group = group || 9999;
		player.color( this._playerColor );

		if ( this.shouldAddSkill ) {
			this.skill( 3, 'Player' );
		}

		return player;
	},

	player : function() {
		// 创建玩家
		var player = this._createPlayer();

		if ( this._groupCount && this._groupCount > 1 ) {
			this._createSoldier( this.soldierCount-1, player.group, this._groupColors[0] );
		}

	},

	_createServant : function( leader ) {
		var actor = Crafty.e("Servant")
						.color( leader.color() );
		actor.leader = leader.getId();
		actor.group = leader.group;

		var x = leader.x, y = leader.y;
		x += randInt( -100, 100 );
		y += randInt( -100, 100 );

		actor.attr( {x: x, y: y} );

		if ( this.shouldAddSkill ) {
			this.skill( 3, actor.getId() );
		}
	},

	skill : function( i, compName ) {
		i = i || 3;
		i = i > SKILL_LIST.length ? SKILL_LIST.length : i;
		compName = compName || 'Player';

		this.shouldAddSkill = true;
		this.skillCount = i;

		var allSkills = Crafty.clone( SKILL_LIST );

		Crafty( compName ).each( function() {
			Arrays.shuffle( allSkills );
			Arrays.shuffle( allSkills );

			if ( this.has( 'Player' ) ) {
				for ( var k in SKILL_LIST ) {
					this.addSkill( SKILL_LIST[k] ); 
				}
				log( 'Player: ' + this.getSkillString() );

			} else {
				for ( var j = 0; j < i; j++ ) {
					this.addSkill( allSkills[j] ); 
				}
				log( 'Soldier: ' + this.getSkillString() );
			}

			this.switchSkill( randInt( 0, this.skills.length -1 ) );
		});
	},

	revival : function( components ) {
		var _this = this;

		components = components || 'Soldier, Player';

		// 复活 
		Crafty.bind( 'ActorDead', function( entity ) {
			var group = entity.group;
			if ( components.indexOf( 'Soldier' ) > -1 && entity.has( 'Soldier' ) ) {
				var group = entity.group;
				setTimeout( function() {
					if ( _this._getSoldierCount( group ) <  _this.soldierCount ) {
						_this._createSoldier( 1, group );
					}
				}, 1000 );
			}

			if ( components.indexOf( 'Player' ) > -1 && entity.has( 'Player' ) ) {
				var group = entity.group;
				setTimeout( function() {
					if ( Crafty( 'Player' ).length <  1 ) {
						_this._createPlayer( group );
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

	group : function( count ) {
		this._groupCount = parseInt( count || 1 );
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
