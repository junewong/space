
/**
 * 可被继承的角色
 */
Crafty.c( "Actor", {
	init: function() {
		this._init();
	},

	_init: function() {
		var _root = this;


		this.speed = 4;
		this._movement = { x: 0, y: 0 };

		this.requires( '2D, DOM, Color, Tween, Collision, Mouse, HTML' )
			.color('orange')
			.replace('<center>|<center>')
			.attr({x:100, y:100, w:20, h:20, rotation:0, running:false});


		this.onHit('Wall',  function( e ) {
			this.stopMovement( e );
			this.trigger( 'HitMaterial', e ); 
		});

		this.onHit( 'Rock', function() {
			this.die();
		});

		this.onHit( 'Ball', function() {
		
		});

		this.onHit( 'Bullet', function( bullets ) {
			if ( this.weapon.isOwner( bullets[0].obj ) ) {
				return;
			}
			this.die();
		});

		this.onHit( 'WeaponPill', function( pills ) {
			var pill =  pills[0].obj;
			var weaponClass = pill.getWeapon();
			this.switchWeapon( weaponClass );
		});

		//this.switchWeapon( 0 );
		this.switchWeapon( randInt( 0, WEAPON_LIST.length-1 ) );
	},

	switchWeapon : function( index ) {
		if ( index === undefined ) {
			return;
		}

		var weaponClass;
		if ( /\d/.test( index ) && index < WEAPON_LIST.length ) {
			weaponClass = WEAPON_LIST[ index ];

		} else {
			weaponClass = index;
		}

		this.weapon = new weaponClass( UID() );

		this.trigger( 'SwitchWeapon', this.weapon );
	},

	attack : function() {
		var p = toAngle( this.x, this.y, this.rotation, this.speed + 1 );
		this.weapon.shootTo( p.x, p.y, this.rotation );
	},

	attackTo : function( entity ) {
		var _this = this;

		this.rotateTo( entity.x, entity.y, function() {
			_this.attack();
		});
	},

	rotateAndMoveTo : function( pos, animated, callback ) {
		var _this = this;
		this.rotateTo( pos.x, pos.y, function() {
			_this.moveTo( pos, animated, callback );
		});

		return this.calculateMoveTime( pos ) + 300;
	},

	moveTo : function( point, animated, callback ) {

		 if ( checkCanvasOut( point.x, point.y ) ) {
			 this.stopMovement();
			 return;
		}

		if ( ! animated ) {
			this._movement.x = point.x - this.x;
			this._movement.y = point.y - this.y;
			this.x = point.x;
			this.y = point.y;

			return 0;

		} else {
			this._movement.x = this.speed;
			this._movement.y = this.speed;

			var time = this.calculateMoveTime( point );
			this.tween( { x: point.x,  y: point.y }, time );
			if ( callback ) {
				this.one( 'TweenEnd', function ( e ) {
					callback( e );
				});
			}

			return time;
		}
	},

	calculateMoveTime : function( point ) {
		var distance = Crafty.math.distance( this.x, this.y, point.x, point.y );
		var time = distance / 100 * 1000;
		return time;
	},

	rotateTo : function( x, y, callback ) {
		var degree = Math.atan2( x - this.x, this.y - y );
		var angle = Crafty.math.radToDeg( degree );
		angle = ( 360 + angle ) % 360;
		this.tween( { rotation: angle }, 300 )
			.one( 'TweenEnd', function( e ) {
				if ( callback ) {
					callback( e );
				}
			});
	},

	goBack : function( distance, animated, callback ) {
		distance = distance || this.speed;
		var point = toAngle( this.x, this.y,  this.rotation + 180, distance );
		this.moveTo( point, animated, callback );
	},

	stopTweenMove : function() {
		this.tween( {x:this.x, y:this.y}, 0 );
	},

	// Stops the movement
	stopMovement: function( e ) {
		this.running = false;

		if (this._movement) {
			this.stopTweenMove();

			var offset = 2;

			var xOffset = this._movement.x < 0 ? -offset : (this._movement.x > 0 ? offset : 0 );
			var yOffset = this._movement.y < 0 ? -offset : (this._movement.y > 0 ? offset : 0 );
			this.x -= (this._movement.x + xOffset);
			this.y -= (this._movement.y + yOffset);
		}
	 },

	die: function() {
		die( this );
	}
});


/**
 * 玩家控制的战士
 */
Crafty.c( "Player", extend( Crafty.components().Actor, {
	init: function() {
		this._init();
		this.bind( 'KeyDown', function( e ) {
			this.running = true;

			var _this = this;

			var run = function() {
				var rotation = _this.rotation  % 360;
				var k = e.keyCode;
				var point;

				// left
				if ( k == 37 || k == 65 ) {
					 _this.rotation = rotation - _this.speed;

				// right
				} else if ( k == 39 || k == 68 ) {
					 _this.rotation = rotation + _this.speed;

				// up
				} else if ( k == 38 || k == 87 ) {
					point = toAngle( _this.x, _this.y, rotation, _this.speed );
					_this.moveTo( point );

				// down
				} else if ( k == 40 || k == 83 ) {
					point = toAngle( _this.x, _this.y,  rotation + 180, _this.speed );
					_this.moveTo( point );

				// space
				} else if ( k == 32 ) {
					_this.attack();

				//  change weapon
				} else if ( k >= Crafty.keys['0'] && k <= Crafty.keys['9'] ) {
					var index = k - 49;
					_this.switchWeapon( index );
				}

				// continue
				if ( _this.running ) {
					setTimeout( run, 40 );
				}
			};

			run();

			})
			.bind( 'KeyUp', function( e ) {
				this.running = false;

				this._movement.x = 0;
				this._movement.y = 0;
			})
			.bind( 'CanvasMouseClick', function( e ) {
				var mouseX = e.clientX, mouseY = e.clientY;
				this.rotateTo( mouseX, mouseY );
			})
			.bind( 'CanvasMouseDbClick', function( e ) {
				var mouseX = e.clientX, mouseY = e.clientY;
				this.rotateTo( mouseX, mouseY );
				this.moveTo( {x: mouseX, y:mouseY}, true );
			})
			.bind( 'CanvasMouseRightClick', function( e ) {
				var _this = this;
				var mouseX = e.clientX, mouseY = e.clientY;
				this.rotateTo( mouseX, mouseY, function() {
					_this.attack();
				});
			});

			this.bind( 'HitMaterial', function( e ) {
				var _this = this;
				this.goBack( 2 * this.speed, true, function() {
				});
			});
	},

	die: function() {
		this.running = false;
		this.unbind( 'KeyDown' );
		die( this );
	}

}) );

/**
 *  AI控制的战士
 */
Crafty.c( "Soldier", extend( Crafty.components().Actor, {
	init: function() {
		this._init();

		var _this = this;

		this.visibleDistance = 200;
		this.addVisibleFrame();

		this.action = null;
		this.lastMeetEntity = null;

		this.bind( 'SwitchWeapon', function( weapon ) {
			//this.updateVisibleFrame();
		});

		this.bind( 'HitMaterial', function( e ) {
			var _this = this;
			this.setAction( null );
			this.goBack( 4 * this.speed, true, function() {
				var obj = e[0].obj;
				_this.roundAction( obj );
			});
		});
		
		this.bind( 'MeetEnemy', function( hitData ) {
			var entity = hitData.shift().obj;
			if ( entity == this ) {
				if ( hitData.length === 0 ) {
					return;

				} else {
					entity = hitData.shift().obj;
				}
			}

			this.lastMeetEntity = entity;
			this.attackAction( entity );
		});

		this.bind( 'LostEnemy', function( name ) {
			this.setAction( null );
			if ( name === 'Player' || name === 'Soldier' ) {
				this.seekAction( this.lastMeetEntity );
			}

		});

		this.performAction();
	},

	addVisibleFrame : function() {
		var _this = this;

		var size = this.visibleDistance || this.weapon.config.distance * 0.8;

		//this.visibleFrame = Crafty.e( '2D, DOM, Collision, WiredHitBox' )
		this.visibleFrame = Crafty.e( '2D, DOM, Collision' )
								.origin( 'center' )
								.attr( {w: size, h: size} );

		var checkComps = 'Soldier,Player,Rock';
		this.visibleFrame.checkHits( checkComps )
				.bind( 'HitOn', function( hitData ) {
					_this.trigger( 'MeetEnemy', hitData );
					//this.resetHitChecks( checkComps );
				})
				.bind( 'HitOff', function( name ) {
					_this.trigger( 'LostEnemy', name );
				});

		this.attach( this.visibleFrame );

	},

	updateVisibleFrame : function() {
		this.addVisibleFrame();
	},

	setAction : function( name, action ) {
		console.log( 'action: ' + name );
		this.action = action || null;

	},

	performAction : function() {
		var defaultTime  = 200;
		var time = defaultTime;

		if ( this.action ) {
			time = this.action();
			if ( time === undefined ) {
				time = defaultTime;

			} else if ( time === 0 ) {
				this.setAction( null );
			}
			this.visibleFrame.resetHitChecks();

		} else {
			this.wandAction();
		}

		this.timeout( this.performAction, time - 50 );
	},

	attackAction : function( entity ) {
		var _this = this;

		this.stopTweenMove();

		var count = 20;
		var action = function() {
			if ( count <= 0 ) {
				return 0;
			}
			if ( ! entity ) {
				return 0;
			}
			_this.attackTo( entity );
			count--;

			return 100;
		};
		this.setAction( 'attackAction', action );
	},

	wandAction : function() {
		var _this = this;

		var isMoving = false;

		var action = function() {
			isMoving = true;
			if ( isNaN(  _this.rotation ) )  {
				return 0;
			}
			var pos = _this.randPositionByAngle( _this.rotation - 120, _this.rotation + 120, randInt( 20, CANVAS_WIDTH /2 ) );
			var time = _this.rotateAndMoveTo( pos, true, function() {
				isMoving = false;
			});
			return time;
		};

		this.setAction( 'wand', action );

		return 1000;
	},

	seekAction : function( entity ) {
		if ( ! entity ) {
			return;
		}

		var _this = this;

		var action = function()  {
			if ( ! entity ) {
				return 0;
			}
			var time = _this.rotateAndMoveTo( {x:entity.x, y:entity.y}, true, function()  {
				var distance = Crafty.math.distance( _this.x, _this.y, entity.x, entity.y );
				if ( distance > _this.visibleDistance * 1.5 ) {
					_this.setAction( null );
				}
			});
			return time;
		};

		this.setAction( 'seek', action );
	},

	roundAction: function( obj ) {
		var _this = this;

		/*
		var offset = Math.max( this.w, this.h );

		var x = this.x < obj.x ? obj.x - offset : obj.x + obj.w + offset;
		var y = this.y < obj.y ? obj.y - offset : obj.y + obj.h + offset;

		//var dx = ( this.y < obj.y ? 1 : -1 ) * ( this.obj.x + this.obj.w + 2 * offset ) + x;
		//var dy = ( this.x < obj.x ? 1 : -1 ) * ( this.obj.y + this.obj.h + 2 * offset ) + y;
		*/

		var size = Math.max( obj.w, obj.h );
		var p = this.randPositionByAngle( this.rotation + 90, this.rotation + 180 , size * 2 );

		var action = function() {
			var time = _this.rotateAndMoveTo( {x: p.x, y: p.y}, true, function() {
				_this.wandAction();
			});
			return time;
		};

		this.setAction( 'round', action );
	},

	randPositionByAngle : function( angle1, angle2, maxDistance ) {
		var angle = randInt( angle1, angle2 + 180 );
		var distance = randInt( 10, maxDistance );

		var p = toAngle( this.x, this.y, angle, distance );
		return p;
	}


}) );
