
Crafty.c( "Actor" );

/**
 * 可被继承的角色
 */
Crafty.c( "ActorBase", {
	init: function( config ) {
		this._init( config );
	},

	_init: function( config ) {
		var _root = this;

		this.config = extend( {
			w : 20,
			h : 20,
			speed : 4,
			maxHP : 100,
			leader: 0,
			group : 0

		}, config || {} );


		this.isDead = false;

		this.group = this.config.group;
		this.leader = this.config.leader;

		this.maxHP = this.config.maxHP;
		this.HP = this.maxHP;

		this.buffers = { 
			speed : 0,
			damage : 0,
			hp : 0
		};

		this.speed = this.config.speed;
		this._movement = { x: 0, y: 0 };
		this._targetPosition = { x: 0, y: 0 };

		this.requires( 'Actor, Skill, 2D, Canvas, Color, Tween, Collision, Mouse' )
			.attr( { x:100, y:100, w:_root.config.w, h:_root.config.h, rotation:0, running:false } )
			.color('orange');

		this.gunPipe = Crafty.e( '2D, Canvas, Color')
						.attr( {x: this.x + this.w/2-1, y:this.y-this.h*0.4, w:2, h:this.h*0.7} )
						.color( 'black' );
		this.attach( this.gunPipe );

		this.hpBar = Crafty.e( '2D, Canvas, Color')
						.attr( {x: this.x, y:this.y+_root.h-2, w:_root.w, h:2} )
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

		this.onHit( 'SkillObstacle',  function( e ) {
			var obstacle  = e[0].obj;
			if ( obstacle &&  obstacle.owner !== this.getId() ) {
				this.stopMovement( e );
			}
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
			var damage = 0, bullet, dashBullet;
			for ( var i in bullets ) {
				bullet = bullets[i].obj;
				if ( this.weapon.isOwner( bullet ) ) {
					continue;
				}
				if ( bullet.dash ) {
					dashBullet = bullet;
				}
				damage += bullet.damage;
			}

			if ( damage === 0 ) {
				return;
			}

			var attackerId = bullet.owner;

			this.hurt( damage, attackerId );

			// 如果子弹带击退效果
			if ( dashBullet && dashBullet.dash > 0 && ! dashBullet.running ) {
				dashBullet.running = true;
				var _this = this;
				this.stopTweenMove();
				this.dashBack( dashBullet.dash, Crafty( dashBullet.owner ), function() {
					_this.beAttacked( damage, attackerId );
				});
				dashBullet.destroy();
			}
		});

		this.onHit( 'WeaponPill', function( pills ) {
			var pill =  pills[0].obj;
			var weaponClass = pill.getWeapon();
			this.switchWeapon( weaponClass );
		});

		// 武器
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

		this.changeHP( -1 * damage );
		this.beAttacked();

	},

	beAttacked : function( damage, attackerId ) {
		if ( ! this.isDead ) {
			Crafty.trigger( 'BeAttacked', {damage: damage, attackerId: attackerId, targetId: this.getId() } );
		}
	},

	changeHP : function( offset ) {
		this.HP += offset;

		if ( this.HP > this.maxHP ) {
			this.HP = this.maxHP;
		}

		var width = ( this.HP < 0 ? 0 : this.HP ) / this.maxHP * this.w;
		this.hpBar.attr( {w: width} );

		if ( this.HP <= 0 ) {
			this.die();
		}

		//log( 'id: ' + this.getId() + ' hp: ' + this.HP + ' damage:' + doffset );///
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

	executeSkill : function( targetX, targetY ) {
		if ( ! this.skill || ! this.skill.isEnabled() ) {
			return;
		}

		var p = toAngle( this.gunPipe.x, this.gunPipe.y, this.rotation, this.speed + 1 );

		if ( targetX !== undefined && targetY !== undefined ) {
			this.skill.shootTo( p.x, p.y, this.rotation, targetX, targetY );
		} else {
			this.skill.shootTo( p.x, p.y, this.rotation );
		}
	},

	executeSkillTo : function( entity ) {
		if ( ! this.skill ) {
			return;
		}

		var _this = this;

		this.rotateTo( entity.x, entity.y, function() {
			if ( _this.skill && _this.skill.config.needTarget ) {
				_this.executeSkill( entity.x + randInt( 0, 80 ),  entity.y + randInt( 0, 80 ) );

			} else {
				_this.executeSkill();
			}
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
			this.one( 'TweenEnd', function ( e ) {
				this.moving = false;
				if ( callback ) {
					callback( e );
				}
			});

			return time;
		}
	},

	calculateMoveTime : function( point ) {
		var distance = Crafty.math.distance( this.x, this.y, point.x, point.y );
		// 至少100像素1秒
		var time = distance / ( 96 + this.speed + this.buffers.speed * 5 ) * 1000;
		return time;
	},

	rotateTo : function( x, y, callback ) {
		var rad = Math.atan2( x - this.x, this.y - y );
		var angle = Crafty.math.radToDeg( rad );
		angle = angle % 360;
		// 默认三百毫秒
		var time = angle == this.rotation ? 0 : ( 304 - this.speed - this.buffers.speed * 10 );
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

		var point = fixPos( toAngle( this.x, this.y, angle, distance ), this.w, this.h );
		return this.moveTo( point, animated, callback, needToRecord );
	},

	dashBack : function( distance, entity, callback ) {
		if ( ! entity ) {
			return;
		}
		var point = fixPos( toAngle( this.x, this.y, entity.rotation, distance ), this.w, this.h );
		return this.moveTo( point, true, function() {
			if ( callback ) {
				callback();
			}
		});
	},

	stopMoving : function() {
		this.stopTweenMove();
		Crafty.trigger( 'StopMove' );
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

			var offset = 4;

			var xOffset = this._movement.x < 0 ? -offset : (this._movement.x > 0 ? offset : 0 );
			var yOffset = this._movement.y < 0 ? -offset : (this._movement.y > 0 ? offset : 0 );
			this.x -= (this._movement.x + xOffset);
			this.y -= (this._movement.y + yOffset);
		}

		Crafty.trigger( 'StopMovement' );
	 },

	killServants : function() {
		var _this = this;
		Crafty( 'Servant' ).each( function() {
			if ( this.leader === _this.getId() ) {
				this.die();
			}
		});
	},

	die: function() {
		if ( ! this.isDead ) {
			this.isDead = true;
			this.killServants();
			die( this );
		}
	}
});


/**
 * 玩家控制的战士
 */
Crafty.c( "Player", extend( Crafty.components().ActorBase, {
	init: function( config ) {
		this._init( config );

		var skillKeys = [
			Crafty.keys.Z,
			Crafty.keys.X,
			Crafty.keys.C,
			Crafty.keys.V,
			Crafty.keys.B,
			Crafty.keys.N,
			Crafty.keys.M,
			Crafty.keys.L,
			Crafty.keys.K,
			Crafty.keys.J,
			Crafty.keys.H,
			Crafty.keys.G
		];

		var isSkillKey = function( k ) {
			for( var i in skillKeys ) {
				if ( k === skillKeys[i] ) {
					return true;
				}
			}
			return false;
		};

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

				// enter, use skill
				} else if ( k == Crafty.keys.ENTER || k == Crafty.keys.F ) {
					_this.executeSkill();
					_this.running = false;

				//  change weapon
				} else if ( k >= Crafty.keys['0'] && k <= Crafty.keys['9'] ) {
					var index = k - 49;
					_this.switchWeapon( index );

				} else if ( isSkillKey( k ) ) {
					var i = 0;
					for ( ; i < skillKeys.length && skillKeys[i] !== k; i ++ );
					_this.switchSkill( i );
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
			this.rotateAndMoveTo( {x: mouseX, y:mouseY}, true );
		})
		.bind( 'CanvasMouseRightClick', function( e ) {
			var _this = this;
			var mouseX = e.clientX, mouseY = e.clientY;
			this.rotateTo( mouseX, mouseY, function() {
				_this.executeSkill( mouseX, mouseY );
			});
		})
		.bind( 'CanvasMouseLongPressDown', function( e ) {
			var _this = this;
			this.shooting = true;
			var mouseX = e.clientX, mouseY = e.clientY;

			this.rotateTo( mouseX, mouseY, function() {
				_this.attack();
				var shoot = function() {
					_this.attack();
					if ( _this.shooting ) {
						_this.timeout( shoot, 50 );
					}
				};
				shoot();
			});
		})
		.bind( 'CanvasMouseLongPressUp', function( e ) {
			this.shooting = false;
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
		if ( ! this.isDead ) {
			this.isDead = true;
			this.killServants();
			die( this );
		}
	}

}) );

/**
 *  AI控制的战士
 */
Crafty.c( "Soldier", extend( Crafty.components().ActorBase, {
	init: function( config ) {
		this._init( config );

		var _this = this;

		this.waiting = false;
		this.moving = false;
		this.searchingPath = false;

		this.visibleDistance = 300;
		this.addVisibleFrame();

		this.action = null;

		this.lastMeetEntity = null;

		this.debugSearchPathing = true;

		// 添加有限状态机
		this.requires( 'ActorFsm' );


		this.bind( 'SwitchWeapon', function( weapon ) {
			//this.updateVisibleFrame();
		});

		this.bind( 'HitMaterial', function( e ) {
			if ( this.searchingPath ) {
				return;
			}
			var _this = this;
			this.stopMoving();

			var entity = e[0].obj;

			this.searchingPath = true;
			this.goBack( 4 * this.speed, true, entity, function() {
				var obj = e[0].obj;
				_this.searchingPath = false;
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

			if ( this.group && entity.group && entity.group === this.group ) {
				return;
			}

			this.lastMeetEntity = entity;

			log( this.getId() + ' meet enemy, attackerId:' + entity.getId() );

			if ( this.fsm ) {
				this.fsm.meetEnemy( entity );
			}
		});

		this.bind( 'LostEnemy', function( name ) {
			if ( name === 'Actor' ) {
				if ( this.fsm ) {
					this.fsm.enemyTryEscape( this.lastMeetEntity );
				}
			}

		});

		this.bind( 'BeAttacked', function( data ) {
			if ( data.attackerId === this.getId() ) {
				return;
			}

			if ( data.targetId !== this.getId() ) {
				return;
			}

			if ( Crafty( data.attackerId ).group === this.group ) {
				return;
			}

			var damage = data.damage;
			if ( this.needToShun( damage ) ) {
				log( this.getId() + ' be attacked, need to shun, attackerId:' + data.attackerId );
				if ( this.fsm ) {
					this.fsm.beAttacked( data.attackerId );
				}
			}
		});

		this.bind( 'StopMovement', function() {
			//log( 'event StopMovement ...' );///
			//this.fsm.beStopMovement();
		});

		this.bind( 'StopMove', function() {
			log( 'event StopMove ...' );///
			if ( this.fsm ) {
				this.fsm.beStopMovement();
			}
		});

		this.bind( 'Unpause', function() {
		});


		this.timeout( function() {
			if ( ! _this.waiting ) {
				this.initFsm();
			}
		}, 300 );
	},

	addVisibleFrame : function() {
		var _this = this;

		var size = this.visibleDistance || this.weapon.config.distance * 0.8;

		//this.visibleFrame = Crafty.e( '2D, Canvas, Collision, WiredHitBox' )
		this.visibleFrame = Crafty.e( '2D, Canvas, Collision' )
								.origin( 'center' )
								.attr( {w: size, h: size} );

		var checkComponet = 'Rock, Actor';
		this.visibleFrame.checkHits( checkComponet )
				.bind( 'HitOn', function( hitData ) {
					_this.trigger( 'MeetEnemy', hitData );
					setTimeout( function() {
						_this.visibleFrame.resetHitChecks( checkComponet );
					}, 300 );
				})
				.bind( 'HitOff', function( name ) {
					_this.trigger( 'LostEnemy', name );
					_this.visibleFrame.resetHitChecks( checkComponet );
				});

		this.attach( this.visibleFrame );

		this.updateVisibleFrame();
	},

	updateVisibleFrame : function() {
		//var size = this.weapon.config.distance;
		var size = this.visibleDistance > this.weapon.config.distance * 0.8 ? this.visibleDistance : this.weapon.config.distance * 0.8;

		var x = this.x + this.w/2 - size/2;
		var y = this.y + this.h/2 - size/2;
		this.visibleFrame.attr( {x: x, y: y, w: size, h: size} );

		this.visibleDistance = size;
	},

	roundAction: function( obj ) {
		var _this = this;

		var targetX = this._targetPosition.x;
		var targetY = this._targetPosition.y;

		this.roundTo( targetX, targetY );
	},

	roundTo : function( targetX, targetY ) {
		if ( this.searchingPath ) {
			return;
		}
		this.searchingPath = true;

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
			this.searchingPath = false;
			return;
		}

		if ( this.fsm ) {
			this.fsm.beBlocked( paths );

		} else {
			var _this = this;
			setTimeout( function() {
				_this.fsm.beBlocked( paths );
			}, 300 );
		}
	},


	randPositionByAngle : function( angle1, angle2, maxDistance ) {
		var angle = randInt( angle1, angle2 + 180 );
		var distance = randInt( 10, maxDistance );

		var pos = toAngle( this.x, this.y, angle, distance );
		pos = fixPos( pos, this.w, this.y );
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
	}


}) );

/**
 *  AI控制的召唤出来的仆人
 */
Crafty.c( "Servant", extend( Crafty.components().Soldier, {
	init: function() {
		var config = {
			w : 10,
			h : 10,
			maxHP : 50
		};
		this.superInit( config );
	}

}) );

