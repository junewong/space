
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

		this.requires( '2D, Canvas, Color, Tween, Collision, Mouse' )
			.attr( {x:100, y:100, w:20, h:20, rotation:0, running:false} )
			.color('orange');

		this.gunPipe = Crafty.e( '2D, Canvas, Color')
						.attr( {x: this.x + this.w/2-1, y:this.y-7, w:2, h:12} )
						.color( 'black' );
		this.attach( this.gunPipe );

		this.hpBar = Crafty.e( '2D, Canvas, Color')
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
			this.die();
		});

		this.onHit( 'Bullet', function( bullets ) {
			var damage = 0, bullet;
			for ( var i in bullets ) {
				bullet = bullets[i].obj;
				if ( this.weapon.isOwner( bullet ) ) {
					return;
				}
				damage += bullet.damage;
			}

			var attackerId = bullet.owner;

			this.hurt( damage, attackerId );
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

		this.weapon = new weaponClass( this.getId() );

		this.trigger( 'SwitchWeapon', this.weapon );
	},

	hurt: function( damage, attackerId ) {
		if ( damage <= 0 ) {
			return;
		}

		if ( attackerId === this.getId() ) {
			return;
		}

		this.HP -= damage;

		var width = ( this.HP < 0 ? 0 : this.HP ) / this.maxHP * this.hpBar.w;
		this.hpBar.attr( {w: width} );

		if ( this.HP <= 0 ) {
			this.die();

		} else {
			Crafty.trigger( 'BeAttacked', {damage: damage, attackerId: attackerId} );
		}
	},

	getAttackDistance : function() {
		return this.weapon.config.distance;
	},

	attack : function() {
		var p = toAngle( this.gunPipe.x, this.gunPipe.y, this.rotation, this.speed + 1 );
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

	moveTo : function( point, animated, callback, needToRecord ) {
		 if ( checkCanvasOut( point.x, point.y ) ) {
			 this.stopMovement();
			 return 0;
		}

		 if ( this.moving ) {
			 return;
		 }

		if ( needToRecord !== false ) {
			this._targetPosition.x = point.x;
			this._targetPosition.y = point.y;
		}

		this.moving = true;

		if ( ! animated ) {
			this._movement.x = point.x - this.x;
			this._movement.y = point.y - this.y;
			this.x = point.x;
			this.y = point.y;
			this.moving = false;

			return 100;

		} else {
			this._movement.x = this.speed;
			this._movement.y = this.speed;

			var time = this.calculateMoveTime( point );
			this.tween( { x: point.x,  y: point.y }, time );
			if ( callback ) {
				this.one( 'TweenEnd', function ( e ) {
					this.moving = false;
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

	goBack : function( distance, animated, entity, callback, needToRecord ) {
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
		return this.moveTo( point, animated, callback, needToRecord );
	},

	stopTweenMove : function() {
		this.tween( {x:this.x, y:this.y}, 0 );
		this.moving = false;
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

		Crafty.trigger( 'StopMovement' );
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
				var _this = this;
				var mouseX = e.clientX, mouseY = e.clientY;
				this.rotateTo( mouseX, mouseY, function() {
					_this.attack();
				});
			})
			.bind( 'CanvasMouseDbClick', function( e ) {
				var mouseX = e.clientX, mouseY = e.clientY;
				this.rotateTo( mouseX, mouseY );
				this.moveTo( {x: mouseX, y:mouseY}, true );
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
				this.goBack( 2 * this.speed, true, entity, false );
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
		this.moving = false;
		this.searchingPath = false;

		this.visibleDistance = 300;
		this.addVisibleFrame();

		this.action = null;

		this.lastMeetEntity = null;

		this.debugSearchPathing = true;


		this.bind( 'SwitchWeapon', function( weapon ) {
			//this.updateVisibleFrame();
		});

		this.bind( 'HitMaterial', function( e ) {
			if ( this.searchingPath ) {
				return;
			}
			var _this = this;
			this.setAction( null );
			this.stopTweenMove();
			var entity = e[0].obj;
			this.goBack( 4 * this.speed, true, entity, function() {
				var obj = e[0].obj;
				_this.roundAction( obj );
			}, false );
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

		this.bind( 'BeAttacked', function( data ) {
			if ( data.attackerId === this.getId() ) {
				return;
			}

			var damage = data.damage;
			if ( this.needToShun( damage ) ) {
				this.shunAction( data.attackerId );
			}
		});

		this.bind( 'ActionEnd', function( action ) {
			log( 'perform end for action: ' + ( action ? action.name : 'null' ) );///
			/*
			if ( action.getCostTime() < 100 ) {
				this.timeout( function() {
					_this.performAction();
				}, 100 );

			} else {
				_this.performAction();
			}
			*/
		});

		this.bind( 'StopMovement', function() {
			log( 'event StopMovement ...' );///
			if ( _this.action ) {
				log( 'action ' + _this.action.name + ' cancel.' );
				_this.action.cancel();
			}
			if ( _this.action && _this.action.getCostTime() < 100 ) {
				return;

			} else {
				//_this.performAction();
			}
		});

		this.timeout( this.performAction, 200 );
	},

	addVisibleFrame : function() {
		var _this = this;

		var size = this.visibleDistance || this.weapon.config.distance * 0.8;

		//this.visibleFrame = Crafty.e( '2D, Canvas, Collision, WiredHitBox' )
		this.visibleFrame = Crafty.e( '2D, Canvas, Collision' )
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

	setAction : function( action ) {
		if ( action && this.action && this.action.performing ) {
			if ( this.action.desire > action.desire ) {
				log( 'pass action: ' + action.name + ', current action: ' + this.action.name );
				return;

			} else {
				log( 'action: ' + ( action ? action.name : '' ) );
				this.action.destroy();
				this.action = action;
				this.performAction();

			}
		}

		if ( action && action.name != 'round' ) {
			this.searchingPath = false;
		}

		log( 'action: ' + ( action ? action.name : '' ) );
		this.action = action || null;
	},

	performAction : function() {
		var _this = this;

		var time = 0;
		if ( this.action ) {
			if ( ! this.action.performing ) {
				log( 'performing action: ' + ( this.action ? this.action.name : 'null' ) );///
				time = this.action.perform();
				this.visibleFrame.resetHitChecks();
				if ( ! time ) {
					this.setAction( null );
				}
			}

		} else {
			this.wandAction();
			time = this.action.perform();
			if ( ! time ) {
				this.setAction( null );
			}
		}

		this.timeout( function() {
			_this.performAction();
		}, 200 );
	},

	attackAction : function( entity ) {
		var _this = this;

		this.stopTweenMove();

		var count = 20;
		var action = new Action( 'attackAction', ACTION_LEVEL_NORMAL, function() {
			if ( count <= 0 ) {
				return 0;
			}
			if ( ! entity ) {
				return 0;
			}
			_this.attackTo( entity );
			count--;

			action.finish();

			return 100;
		});

		this.setAction( action );
	},

	wandAction : function() {
		var _this = this;

		var action = new Action( 'wand', ACTION_LEVEL_LOW,  function() {
			if ( isNaN(  _this.rotation ) )  {
				return 0;
			}
			var pos = _this.randPositionByAngle( _this.rotation - 120, _this.rotation + 120, randInt( 20, CANVAS_WIDTH /2 ) );
			var time = _this.rotateAndMoveTo( pos, true, function() {
				action.finish();
			});
			return time;
			//_this.roundTo( pos.x, pos.y );
		});

		this.setAction( action );

		return 1000;
	},

	seekAction : function( entity ) {
		if ( ! entity ) {
			return;
		}

		var _this = this;

		var action = new Action( 'seek', ACTION_LEVEL_NORMAL, function()  {
			if ( ! entity ) {
				return 0;
			}
			var time = _this.rotateAndMoveTo( {x:entity.x, y:entity.y}, true, function()  {
				var distance = Crafty.math.distance( _this.x, _this.y, entity.x, entity.y );
				if ( distance > _this.visibleDistance * 1.5 ) {
					_this.setAction( null );
				}
				action.finish();
			});
			return time;
		});

		this.setAction( action );
	},

	roundAction: function( obj ) {
		var _this = this;

		var targetX = this._targetPosition.x;
		var targetY = this._targetPosition.y;

		this.roundTo( targetX, targetY );
	},

	roundTo : function( targetX, targetY ) {
		this.stopTweenMove();

		var callback = this.debugSearchPathing ? function( pos ) {
			var block = Crafty.e( '2D, Canvas, Color' )
				.attr( {x: pos.x, y: pos.y, w:20, h:20, alpha: 0.6} )
				.color( 'green' );

			setTimeout( function() {
				block.destroy();
			}, 10000 );

		} : null;

		var paths = Game.battleMap.findPath( this, targetX, targetY, callback );
		log( 'create path length: ' + paths.length );///

		if ( ! paths ) {
			return;
		}

		this.moveOnPathAction( paths );
	},

	moveOnPathAction : function( paths ) {
		var _this = this;

		if ( ! paths || paths.length === 0 ) {
			return 0;
		}

		var i = 0;
		var action = new Action( 'moveOnPath', ACTION_LEVEL_HIGH, function() {
			var path = paths[i];
			if ( ! path ) {
				this.searchingPath = false;
				log( 'No path to walk.' );
				return 0;
			}
			//log( 'next path, i:' + i + ' path:' + path );///
			var time = _this.rotateAndMoveTo( path, true, function() {
				i++;
				if ( i >= paths.length - 1 ) {
					this.searchingPath = false;
					action.finish();
				} else {
					action.perform();
				}
			});
			return time;
		});

		this.setAction( action );
		this.searchingPath = true;
	},

	randPositionByAngle : function( angle1, angle2, maxDistance ) {
		var angle = randInt( angle1, angle2 + 180 );
		var distance = randInt( 10, maxDistance );

		var pos = toAngle( this.x, this.y, angle, distance );
		pos.x = Math.abs( pos.x );
		pos.y = Math.abs( pos.y );
		return pos;
	},

	// 跟目标之间是否存在障碍
	hasObstacle: function( obj ) {
		var exist = Game.battleMap.checkObstacal( this.x, this.y, obj.x, obj.y );
		return exist;
	},

	lastDamage : 0,
	lastDamageTime : + new Date(),

	needToShun : function( damage ) {
		var now = + new Date();
		var isTimeout = ( now - this.lastDamageTime ) / 1000 > 3;

		this.lastDamage += damage;
		this.lastDamageTime = now;

		if ( isTimeout ) {
			this.lastDamageTime = now;
			lastDamage = 0;
			return false;
		}

		if ( this.lastDamage > this.maxHP / 10 ) {
			lastDamage = 0;
			return true;
		}

		return false;
	},

	shunAction : function( attackerId ) {
		if ( attackerId === undefined) {
			return;
		}

		var attacker = Crafty( attackerId );
		if ( ! attacker ) {
			return;
		}

		var _this = this;
		var execute;

		var distance = attacker.getAttackDistance() / 2;

		var seed = randInt( -1, 1 );

		if ( seed === 0 ) {
			execute = function() {
				return _this.goBack( distance, true, function() {
					action.finish();
				});
			};

		} else {
			var rad = Math.atan2( attacker.x - this.x, attacker.y - this.y );
			var angle = Crafty.math.radToDeg( rad );
			angle += ( seed * 90 );

			var pos = toAngle( this.x, this.y, angle, distance );

			execute = function() {
				return _this.moveTo( pos, true, function() {
					action.finish();
				});
			};
		}

		var action = new Action( 'shun', ACTION_LEVEL_HIGH, execute );


		this.setAction( action );
	}


}) );
