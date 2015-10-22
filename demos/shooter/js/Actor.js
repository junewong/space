
/**
 * 可被继承的角色
 */
Crafty.c( "Actor", {
	init: function() {
		this._init();
	},

	_init: function() {
		var _root = this;

		this.isDead = false;

		this.maxHP = 100;
		this.HP = this.maxHP;

		this.speed = 4;
		this._movement = { x: 0, y: 0 };
		this._targetPosition = { x: 0, y: 0 };

		this.requires( '2D, Canvas, Color, Tween, Collision, Mouse' )
			.attr( {x:100, y:100, w:20, h:20, rotation:0, running:false} )
			.color('orange');

		this.gunPipe = Crafty.e( '2D, Canvas, Color')
						.attr( {x: this.x + this.w/2-1, y:this.y-this.h*0.4, w:2, h:this.h*0.7} )
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

		// 武器
		//this.switchWeapon( 0 );
		this.switchWeapon( randInt( 0, WEAPON_LIST.length-1 ) );

		// 技能
		this.skills = [];
		this.skill = null;
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

	addSkill : function( skillClass ) {
		var skill = new skillClass( this.getId() );
		this.skills.push( skill );
		if ( ! this.skill ) {
			this.skill = skill;
		}
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

		log( 'id: ' + this.getId() + ' hp: ' + this.HP + ' damage:' + damage );///

		if ( this.HP <= 0 ) {
			this.die();

		} else {
			Crafty.trigger( 'BeAttacked', {damage: damage, attackerId: attackerId, targetId: this.getId() } );
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

	executeSkill : function() {
		if ( ! this.skill ) {
			return;
		}

		var p = toAngle( this.gunPipe.x, this.gunPipe.y, this.rotation, this.speed + 1 );
		this.skill.shootTo( p.x, p.y, this.rotation );
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

		var point = fixPos( toAngle( this.x, this.y, angle, distance ), this.w, this.y );
		return this.moveTo( point, animated, callback, needToRecord );
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

	die: function() {
		if ( ! this.isDead ) {
			this.isDead = true;
			die( this );
		}
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

				// enter, use skill
				} else if ( k == Crafty.keys.ENTER ) {
					_this.executeSkill();
					_this.running = false;

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
				var _this = this;
				var mouseX = e.clientX, mouseY = e.clientY;
				this.rotateTo( mouseX, mouseY, function() {
					_this.executeSkill();
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
			die( this );
		}
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

			log( this.getId() + ' meet enemy, attackerId:' + entity.getId() );

			if ( this.fsm ) {
				this.fsm.meetEnemy( entity );
			}
		});

		this.bind( 'LostEnemy', function( name ) {
			if ( name === 'Player' || name === 'Soldier' ) {
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


		this.timeout( this.initFsm, 300 );
	},

	addVisibleFrame : function() {
		var _this = this;

		var size = this.visibleDistance || this.weapon.config.distance * 0.8;

		//this.visibleFrame = Crafty.e( '2D, Canvas, Collision, WiredHitBox' )
		this.visibleFrame = Crafty.e( '2D, Canvas, Collision' )
								.origin( 'center' )
								.attr( {w: size, h: size} );

		var checkComponet = 'Rock, Soldier, Player';
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
