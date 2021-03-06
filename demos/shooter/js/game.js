// define:
var CANVAS_WIDTH = window.innerWidth -20 ||  900;
var CANVAS_HEIGHT = window.innerHeight -20 || 420;
//var CANVAS_WIDTH = 900;
//var CANVAS_HEIGHT = 420;

var TILE_SIZE = 10;

var PLAYER_DEFAULT_GROUP_ID = 99;


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

		this._taskKey = null;

		console.log( 'try to init, canvas width:' + CANVAS_WIDTH + ', height:' + CANVAS_HEIGHT  );

		Crafty.init( CANVAS_WIDTH, CANVAS_HEIGHT );
		Crafty.canvas.init();
		Crafty.box2D.init( 0, 0, 32, false );
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

		this._changeZIndex();

		/*
		var canvas = document.querySelector('canvas');
		var canvas_context = canvas.getContext("2d");
		canvas_context.textBaseline = 'middle';
		canvas_context.textAlign = 'center';
		*/


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

	hpPill: function( max ) {
		max = max || 3;

		var next = function() {

			var time = randInt( 30 * 1000, 2 * 60 * 1000 );
			setTimeout( function(){

				var count = randInt( 1, max );
				randomCreateEntity( count, this.battleMap, function( i ) {
					var pill = Crafty.e("HpPill");
					return pill;
				});
			}, time );

		};
		next();

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

	_getSoldierCount : function( groupId ) {
		if ( ! groupId ) {
			return Crafty( 'Soldier').length;

		} else {
			var count = 0;
			Crafty( 'Soldier' ).each( function() {
				if ( this.groupId === groupId ) {
					count ++;
				}
			});
			return count;
		}
	},

	_createSoldier : function( count, groupId, color, config ) {
		var _this = this;

		randomCreateEntity( count, null, function( i ) {
			var actor = Crafty.e("Soldier");

			var index = 1;
			if ( groupId ) {
				index = groupId > _this._groupColors.length ? 1 : groupId;
			}

			actor.name = '战士' + i;

			color = color || _this._groupColors[ index ];
			actor.color( color );

			actor.setGroupId( groupId || actor.getId() );

			if ( _this.shouldAddSkill ) {
				_this.skill( 3, actor.getId() );
			}

			_this._addTask( actor );

			if ( config ) {
				for ( var k in config ) {
					actor[k] = config[k];
				}
			}

			return actor;
		});
	},

	_createPlayer : function ( groupId, config ) {
		var pos = randPosition();
		var player = Crafty.e("Player")
				.attr({ x: pos.x, y: pos.y } );

		player.name = '玩家';
		player.groupId = groupId || PLAYER_DEFAULT_GROUP_ID;
		player.color( this._playerColor );

		if ( this.shouldAddSkill ) {
			this.skill( 3, 'Player' );
		}

		if ( config ) {
			for ( var k in config ) {
				player[k] = config[k];
			}
		}

		this._addTask( player );

		return player;
	},

	player : function( skillType ) {
		this.playerHasAllSkills = skillType === 'allSkills';

		// 创建玩家
		var player = this._createPlayer();

		if ( this._groupCount && this._groupCount > 1 ) {
			this._createSoldier( this.soldierCount-1, player.groupId, this._groupColors[0] );
		}

	},

	_createServant : function( leader, type ) {
		type = type || 'Servant';

		var actor = Crafty.e( type )
						.color( leader.color() );
		actor.leader = leader.getId();
		actor.groupId = leader.groupId;
		actor.name = leader.name + '仆从';

		var x = leader.x, y = leader.y;
		x += randInt( -100, 100 );
		y += randInt( -100, 100 );

		actor.attr( {x: x, y: y} );

		var skillCount = type == 'Servant' ? 1 : 0;
		if ( this.shouldAddSkill && skillCount > 0 ) {
			this.skill( skillCount, actor.getId() );
		}

		this._addTask( actor );

		return actor;
	},

	base : function( count ) {
		count = parseInt( count || 2 );

		if ( this._groupCount ) {
			randomCreateEntity( this._groupCount -1, this.battleMap, function( i ) {
				var building = Crafty.e("BaseBuilding");
				building.setGroupId( i + 1 );
				return building;
			});

			if ( Crafty( 'Player' ).length ) {
				randomCreateEntity( 1, this.battleMap, function( i ) {
					var building = Crafty.e("BaseBuilding");
					building.setGroupId( Crafty( 'Player' ).get(0).groupId );
					return building;
				});
			}

		} else {

			randomCreateEntity( count, this.battleMap, function( i ) {
				return Crafty.e("BaseBuilding");
			});
		}

	},

	skill : function( i, compName ) {
		var _this = this;

		i = i || 3;
		i = i > SKILL_LIST.length ? SKILL_LIST.length : i;
		compName = compName || 'Player';

		this.shouldAddSkill = true;
		this.skillCount = i;

		var allSkills = Crafty.clone( SKILL_LIST );

		Crafty( compName ).each( function() {
			Arrays.shuffle( allSkills );
			Arrays.shuffle( allSkills );

			if ( this.has( 'Player' ) && _this.playerHasAllSkills ) {
				for ( var k in SKILL_LIST ) {
					this.addSkill( SKILL_LIST[k] ); 
				}
				log( 'Player: ' + this.getSkillString() );

			} else {
				for ( var j = randInt(0, SKILL_LIST.length -1 - i), len = j + i; j < len; j++ ) {
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
			var groupId = entity.groupId;
			var name = entity.name;
			var score = entity.getScore();

			if ( components.indexOf( 'Soldier' ) > -1 && entity.has( 'Soldier' ) ) {
				setTimeout( function() {
					if ( _this._getSoldierCount( groupId ) <  _this.soldierCount ) {
						_this._createSoldier( 1, groupId, null, {name: name, score: score, initScore: score});
						Crafty.trigger( 'ScoreChange' );
					}
				}, 1000 );
			}

			if ( components.indexOf( 'Player' ) > -1 && entity.has( 'Player' ) ) {
				setTimeout( function() {
					if ( Crafty( 'Player' ).length <  1 ) {
						_this._createPlayer( groupId, {score: score, initScore: score} );
						Crafty.trigger( 'ScoreChange' );
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

	task : function( taskKey ) {
		this._taskKey = taskKey;
	},

	_addTask : function( actor ) {
		if ( !this._taskKey || ! actor ) {
			return;
		}

		var taskClass = TASK_MAPS[ this._taskKey ];
		var task = new taskClass();
		actor.taskManager.add( task );
	},

	scoreBar : function() {
		InfoBar.init();

		Crafty.bind( 'ScoreChange', function() {
			InfoBar.updateScores();
		});
		InfoBar.updateScores();
	},

	lowFPS : function() {
		Crafty.timer.FPS( 15 );
	},

	logger : function() {
		log =  function( text ) {
			console.log( text );
		};
	},

	_changeZIndex : function() {
		Crafty( 'Actor' ).each( function() {
			this.changeZIndex();
		});
	},

	_printFsmStates : function() {
		Crafty( 'Soldier' ).each( function( i ) {
			console.log( 'index:' + i + ' id:' + this.getId() + ' level:' +  this.level +' x:' + this.x + ' y:' + this.y + ' current state:' + this.fsm.current  );
		});
	},

	_printSkills : function() {
		Crafty( 'Actor' ).each( function( i ) {
			console.log( 'index:' + i + ' id:' + this.getId() + ' level:' + this.level + ' x:' + this.x + ' y:' + this.y + ' skills' + this.getSkillString()  );
		});
	}
};
