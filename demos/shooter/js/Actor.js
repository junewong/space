
/**
 * 可被继承的角色
 */
Crafty.c( "Actor", {
	init: function() {
		this._init();
	},

	_init: function() {
		var _root = this;

		this.maxHP = 100;
		this.HP = this.maxHP;

		this.speed = 4;
		this._movement = { x: 0, y: 0 };
		this._targetPosition = { x: 0, y: 0 };

		this.requires( '2D, DOM, Color, Tween, Collision, Mouse, HTML' )
			.attr( {x:100, y:100, w:20, h:20, rotation:0, running:false} )
			.replace('<center>|<center>')
			.color('orange');

		this.hpBar = Crafty.e( '2D, DOM, Color')
						.attr( {x: this.x, y:this.y+18, w:20, h:2} )
						.color( 'red' );
		this.attach( this.hpBar );

		this.origin( this.w /2, this.h /2 );

		this.onHit( 'Wall',  function( e ) {
			//this.stopMovement( e );
			this.trigger( 'HitMaterial', e ); 
		});

		this.onHit( 'Player',  function( e ) {
			this.stopMovement( e );
		});

		this.onHit( 'Soldier',  function( e ) {
			this.stopMovement( e );
		});

		this.onHit( 'Rock', function() {
			this.die();
		});

		this.onHit( 'Ball', function() {
		
		});

		this.onHit( 'Bullet', function( bullets ) {
			var damage = 0;
			for ( var i in bullets ) {
				var bullet = bullets[i].obj;
				if ( this.weapon.isOwner( bullet ) ) {
					return;
				}
				damage += bullet.damage;
			}

			this.hurt( damage );
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

	hurt: function( damage ) {
		if ( damage <= 0 ) {
			return;
		}

		this.HP -= damage;

		var width = ( this.HP < 0 ? 0 : this.HP ) / this.maxHP * this.hpBar.w;
		this.hpBar.attr( {w: width} );

		if ( this.HP <= 0 ) {
			this.die();
		}
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
		var rotateTime = this.rotateTo( pos.x, pos.y, function() {
			_this.moveTo( pos, animated, callback );
		});

		return this.calculateMoveTime( pos ) + rotateTime;
	},

	moveTo : function( point, animated, callback ) {

		 if ( checkCanvasOut( point.x, point.y ) ) {
			 this.stopMovement();
			 return;
		}

		this._targetPosition.x = point.x;
		this._targetPosition.y = point.y;

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
		var rad = Math.atan2( x - this.x, this.y - y );
		var angle = Crafty.math.radToDeg( rad );
		angle = angle % 360;
		var time = angle == this.rotation ? 0 : 300;
		this.tween( { rotation: angle }, time )
			.one( 'TweenEnd', function( e ) {
				if ( callback ) {
					callback( e );
				}
		});
		return time;
	},

	goBack : function( distance, animated, entity, callback ) {
		distance = distance || this.speed;

		var angle = 0;
		if ( entity ) {
			var cx = entity.x + entity.w /2;
			var cy = entity.y + entity.h /2;
			var rad = Math.atan2( this.x - cx, this.y - cy );
			angle = Crafty.math.radToDeg( rad );

		} else {
			angle = this.rotation + 180;
		}

		var point = toAngle( this.x, this.y, angle, distance );
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
					setTimeout( run, 50 );
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
				this.moveTo( {x: mouseX, y:mouseY}, true );
			})
			.bind( 'CanvasMouseDbClick', function( e ) {
				var _this = this;
				var mouseX = e.clientX, mouseY = e.clientY;
				this.rotateTo( mouseX, mouseY, function() {
					_this.attack();
				});
			})
			.bind( 'CanvasMouseRightClick', function( e ) {
				var mouseX = e.clientX, mouseY = e.clientY;
				this.rotateTo( mouseX, mouseY );
			})
			.bind( 'ShootButtonDown', function( e ) {
				this.shooting = true;
				var _this = this;
				var shoot = function() {
					_this.attack();
					if ( _this.shooting ) {
						_this.timeout( shoot, 50 );
					}
				};
				shoot();
			})
			.bind( 'ShootButtonUp', function( e ) {
				this.shooting = false;
			});

			this.bind( 'HitMaterial', function( e ) {
				var _this = this;
				var entity = e[0].obj;
				this.goBack( 2 * this.speed, true, entity );
			});
	},

	die: function() {
		this.running = false;
		this.unbind( 'KeyDown' );
		this.unbind( 'KeyUp' );
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

		this.waiting = false;
		this.searchingPath = false;

		this.visibleDistance = 300;
		this.addVisibleFrame();

		this.action = null;
		this.lastMeetEntity = null;

		this.debugSearchPathing = false;


		this.bind( 'SwitchWeapon', function( weapon ) {
			//this.updateVisibleFrame();
		});

		this.bind( 'HitMaterial', function( e ) {
			if ( this.searchingPath ) {
				return;
			}
			var _this = this;
			this.setAction( null );
			var entity = e[0].obj;
			this.goBack( 4 * this.speed, true, entity, function() {
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

			if  ( this.hasObstacle( entity ) ) {
				return;
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

		this.updateVisibleFrame();
	},

	updateVisibleFrame : function() {
		//var size = this.weapon.config.distance;
		var size = this.visibleDistance > this.weapon.config.distance ? this.visibleDistance : this.weapon.config.distance;

		var x = this.x + this.w/2 - size/2;
		var y = this.y + this.h/2 - size/2;
		this.visibleFrame.attr( {x: x, y: y, w: size, h: size} );

		this.visibleDistance = size;
	},

	setAction : function( name, action ) {
		if ( this.searchingPath ) {
			return;
		}
		console.log( 'action: ' + name );
		this.action = action || null;
	},

	performAction : function() {
		if ( this.waiting ) {
			return;
		}

		var defaultTime = 200;
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

		var targetX = this._targetPosition.x;
		var targetY = this._targetPosition.y;

		this.roundTo( targetX, targetY );
	},

	roundTo : function( targetX, targetY ) {
		this.stopMovement();

		var callback = this.debugSearchPathing ? function( pos ) {
			var block = Crafty.e( '2D, DOM, Color' )
				.attr({x: pos.x, y: pos.y, w:20, h:20 } )
				.color( 'green' );

			setTimeout( function() {
				block.destroy();
			}, 20000 );

		} : null;

		var paths = Game.battleMap.findPath( this, targetX, targetY, callback );
		console.log( 'create path length: %d', paths.length );///
		if ( ! paths ) {
			return;
		}

		this.moveOnPathAction( paths );
	},

	moveOnPathAction : function( paths ) {
		var _this = this;

		var i = 0;
		var action = function() {
			var path = paths[i];
			if ( ! path ) {
				this.searchingPath = false;
				return 0;
			}
			//console.log( 'next path, i:' + i + ' path:' + path );///
			var time = _this.rotateAndMoveTo( path, true, function() {
				i++;
				if ( i >= paths.length - 1 ) {
					this.searchingPath = false;
					_this.setAction( null );
				}
			});
			return time;
		};

		this.setAction( 'moveOnPath', action );
		this.searchingPath = true;
	},

	randPositionByAngle : function( angle1, angle2, maxDistance ) {
		var angle = randInt( angle1, angle2 + 180 );
		var distance = randInt( 10, maxDistance );

		var p = toAngle( this.x, this.y, angle, distance );
		return p;
	},

	// 跟目标之间是否存在障碍
	hasObstacle: function( obj ) {
		var exist = Game.battleMap.checkObstacal( this.x, this.y, obj.x, obj.y );
		return exist;
	}


}) );
