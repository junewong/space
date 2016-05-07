
Crafty.c( "Actor", {
	init: function() {
		this.groupId = 0;
		this.leader = 0;
		this.name = '';
	}

});

Crafty.c( "Life", {
	init: function( config ) {
		this.requires( 'Tween' );

		this.maxHP = 100;
		this.HP = this.maxHP;

		this.isDead = false;
	},

	addHPBar : function() {
		this.hpBar = Crafty.e( '2D, Canvas, Color')
						.attr( {x: this.x, y:this.y+this.h-2, w:this.w, h:2} )
						.color( 'red' );
		this.attach( this.hpBar );
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
	},

	hurt: function( damage, attackerId ) {
		if ( damage <= 0 ) {
			return;
		}

		if ( attackerId === this.getId() ) {
			return;
		}

		this.changeHP( -1 * damage );
		this.beAttacked( damage, attackerId );

	},

	beAttacked : function( damage, attackerId ) {
		if ( ! this.isDead ) {
			Crafty.trigger( 'BeAttacked', {damage: damage, attackerId: attackerId, targetId: this.getId() } );
		}
	},

	lastDamage : 0,
	lastDamageTime : + new Date(),

	/**
	 * 遭受足够的攻击
	 */
	damageEnough : function( damage, standard ) {
		var now = + new Date();
		var isTimeout = ( now - this.lastDamageTime ) / 1000 > 3;

		this.lastDamage += damage;
		this.lastDamageTime = now;

		if ( isTimeout ) {
			this.lastDamage = 0;
			return false;
		}

		if ( this.lastDamage > standard ) {
			this.lastDamage = 0;
			return true;
		}

		return false;
	},

	_destroy : function() {
	},

	die: function() {
		if ( ! this.isDead ) {
			this._destroy();
			this.isDead = true;
			die( this );
		}
	}

});

Crafty.c( "Level", {
	init: function() {
		var _this = this;

		this.initScore = 0;
		this.score = 0;
		this.level = 1;
		this.valueScore = 100;

		Crafty.bind( 'ActorDead', function( entity ) {
			if ( entity.lastAttakerId &&
				( entity.lastAttakerId == _this.getId() || Crafty( entity.lastAttakerId ).leader == _this.getId() ) ) {
				//var score = ( entity.level || 1 ) * 100;
				var score = entity.valueScore;
				_this.addScore( score );
			}

		});
	},

	levelUp : function() {
		this.setLevel( this.level + 1 );
	},

	addScore : function( score ) {
		this.setScore( this.score + score );
	},

	setLevel : function( level ) {
		this.level = level;
		if ( this.afterLevelUp ) {
			this.afterLevelUp( this.level );
		}
	},

	setScore : function( score ) {
		var _this = this;

		this.score = score;
		var level = Math.floor( (this.score - this.initScore) / 100 ) + 1;
		this.setLevel( level );
		setTimeout( function() {
			Crafty.trigger( 'ScoreChange', _this, score );
		}, 600 );
	},

	getScore : function() {
		return this.score;
	},

	getLevel : function() {
		return this.level;
	}


	// can ben override
	//afterLevelUp : function( level ) {
	//}

});

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
			groupId : 0

		}, config || {} );


		this.groupId = this.config.groupId;
		this.leader = this.config.leader;

		this.taskManager = new TaskManager( this.getId(), this.groupId );

		this.buffers = { 
			speed : 0,
			damage : 0,
			hp : 0
		};

		this.speed = this.config.speed;
		this._movement = { x: 0, y: 0 };
		this._targetPosition = { x: 0, y: 0 };

		this.requires( 'Actor, Life, Skill, 2D, Canvas, Color, Tween, Collision, Mouse, Box2D, Level' )
			.attr( { x:100, y:100, w:_root.config.w, h:_root.config.h, rotation:0, running:false } )
			.color('orange');

		this.box2d({
				bodyType: 'static',
				density : 8,
				friction : 1,
				restitution : 0
		});

		this.gunPipe = Crafty.e( '2D, Canvas, Color')
						.attr( {x: this.x + this.w/2-1, y:this.y-this.h*0.4, w:2, h:this.h*0.7} )
						.color( 'black' );
		this.attach( this.gunPipe );

		this.maxHP = this.config.maxHP;
		this.HP = this.maxHP;
		this.addHPBar();

		this.origin( this.w /2, this.h /2 );

		this.onHit( 'Obstacle',  function( e ) { //Wall, Building
			this.trigger( 'HitMaterial', e ); 
		});

		this.onHit( 'Actor',  function( e ) {
			this.stopMovement( e );
		});

		this.onHit( 'SkillObstacle',  function( e ) {
			var obstacle  = e[0].obj;
			if ( obstacle &&  obstacle.owner !== this.getId() ) {
				this.stopMovement( e );
			}
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
				this.dashBack( dashBullet.dash, Crafty( dashBullet.owner ) );
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

		this.die = this._die_override;
	},

	setGroupId : function( groupId ) {
		this.groupId = groupId;
		this.taskManager.setGroupId( groupId );
	},

	resize : function() {
		var factor = this.getFactor();
		var rotation = this.rotation;

		this.attr( { w:this.config.w * factor, h:this.config.h * factor, rotation:0 } );
		this.gunPipe.attr( { x: this.x + this.w/2-1, y:this.y-this.h*0.4, w:2*factor, h:this.h*0.7*factor} );
		this.hpBar.attr( {x: this.x, y:this.y+this.h-2, w:this.w, h:2} );
		this.attr( {rotation:rotation} );
	},

	changeZIndex : function() {
		this.attr( {z : this._globalZ + 1} );
		this.gunPipe.attr( {z : this._globalZ + 1} );
		this.hpBar.attr( {z : this._globalZ + 1} );
	},

	getFactor : function() {
		return this.level ? this.level * 0.1 + 1 : 1;
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

	switchTonextSkill : function() {
		this.nextSkill();
		this.skill.showSkillName( this.x, this.y );
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
		/*
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
		*/
	 },

	// @Override
	afterLevelUp : function() {
		this.resize();
	},

	killServants : function() {
		var _this = this;
		Crafty( 'Servant' ).each( function() {
			if ( this.leader === _this.getId() ) {
				this.die();
			}
		});
	},

	_die_override: function() {
		if ( ! this.isDead ) {
			this.isDead = true;
			this.killServants();
			delete this.taskManager;
			die( this, null, 1.5 );
		}
	}
});


/**
 *  AI控制的战士
 */
Crafty.c( "AIBase", extend( Crafty.components().ActorBase, {
	initAIBase : function( config ) {
		this._init( config );

		var _this = this;

		this.waiting = false;
		this.moving = false;
		this.searchingPath = false;

		this.visibleDistance = 300;
		this.addVisibleFrame();

		this.action = null;

		this.lastMeetEntity = null;

		// 最后一个攻击方
		this.lastAttakerId = null;

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
				if ( _this.isRunningAI() ) {
					_this.roundAction( obj );
				}
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

			if ( this.groupId && entity.groupId && entity.groupId === this.groupId ) {
				return;
			}

			this.lastMeetEntity = entity;

			log( this.getId() + ' meet enemy, attackerId:' + entity.getId() );

			if ( this.fsm ) {
				this.fsm.meetEnemy( entity );
			}
		});

		this.bind( 'LostEnemy', function( name ) {
			if ( name === 'Actor' || name === 'Soldier' || name === 'Player' ) {
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

			if ( Crafty( data.attackerId ).groupId === this.groupId ) {
				return;
			}

			if ( Crafty( data.attackerId ).leader === this.groupId ) {
				return;
			}

			var damage = data.damage;
			if ( this.damageEnough( damage, this.maxHP / 10 ) ) {
				log( this.getId() + ' be attacked, need to shun, attackerId:' + data.attackerId );
				if ( this.fsm ) {
					this.fsm.beAttacked( data.attackerId );
				}
			}
			_this.lastAttakerId = data.attackerId;
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

	},

	startAI : function() {
		if ( ! this.fsm ) {
			this.initFsm();
		} else {
			this.fsm.nothingToDo();
		}
	},

	stopAI : function() {
		if ( this.fsm ) {
			this.fsm.terminal();
		}
	},

	isRunningAI : function() {
		return this.fsm && ( ! this.fsm.isFinished() );
	},

	addVisibleFrame : function() {
		if ( this.visibleFrame ) {
			return;
		}

		var _this = this;

		var size = this.visibleDistance || this.weapon.config.distance * 0.8;

		//this.visibleFrame = Crafty.e( '2D, Canvas, Collision, WiredHitBox' )
		this.visibleFrame = Crafty.e( '2D, Canvas, Collision' )
								.origin( 'center' )
								.attr( {w: size, h: size} );

		var checkComponet = 'Actor, Soldier, Rock, BaseBuilding';
		this.visibleFrame.checkHits( checkComponet )
				.bind( 'HitOn', function( hitData ) {
					_this.trigger( 'MeetEnemy', hitData );
					setTimeout( function() {
						_this.visibleFrame.resetHitChecks( checkComponet );
					}, 300 );
				})
				.bind( 'HitOff', function( name ) {
					_this.trigger( 'LostEnemy', name );
					setTimeout( function() {
						_this.visibleFrame.resetHitChecks( checkComponet );
					}, 300 );
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
				if ( _this.fsm ) {
					_this.fsm.beBlocked( paths );
				}
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
	}


}) );


/**
 *  AI控制的战士
 */
Crafty.c( "Soldier", extend( Crafty.components().AIBase, {
	init: function( config ) {
		var _this = this;

		this.initAIBase( config );

		this.timeout( function() {
			if ( ! _this.waiting ) {
				_this.startAI();
			}
		}, 300 );
	}

}) );

/**
 *  AI控制的召唤出来的仆人
 */
Crafty.c( "Servant", extend( Crafty.components().AIBase, {
	init: function() {
		var _this = this;

		var config = {
			w : 10,
			h : 10,
			maxHP : 50
		};

		//this.superInit( config );
		this.initAIBase( config );

		this.valueScore = 50;

		this.timeout( function() {
			if ( ! _this.waiting ) {
				_this.startAI();
			}
		}, 300 );
	}

}) );

/**
 * 玩家控制的战士
 */
Crafty.c( "Player", extend( Crafty.components().AIBase, {
	init: function( config ) {
		this.initAIBase( config );

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

				// change next skill
				} else if ( k == Crafty.keys.TAB || k == Crafty.keys.Q ) {
					_this.switchTonextSkill();
					_this.running = false;

				// switch AI mode
				} else if ( k == Crafty.keys.E ) {
					_this.switchAI();
					_this.running = false;

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

		this.die = this._die_override;
	},

	switchAI : function() {
		if ( ! this.isRunningAI() ) {
			this.startAI();
			showTip( "自动模式", this );
		} else {
			this.stopAI();
			showTip( "手动模式", this );
		}
		if ( this.fsm ) {
			this.autoUseSkill = false;
		}
	},

	_die_override: function() {
		this.running = false;
		this.unbind( 'KeyDown' );
		this.unbind( 'KeyUp' );
		if ( ! this.isDead ) {
			this.isDead = true;
			this.killServants();
			die( this, null, 1.5 );
		}
	}

}) );

/**
 *  基地建筑
 */
Crafty.c( "BaseBuilding",  {
	init: function() {
		var _this = this;

		this.groupId = 0;

		this.size = 86;
		this.requires( 'Life, 2D, Canvas, Color, Collision, Text' )
			.color('DARKKHAKI')
			.textFont( { size: '48px', weight: 'bold' } )
			.text( 'B' )
			.attr( { w:this.size, h:this.size } );

		this.maxHP = 2000;
		this.HP = this.maxHP;

		this.isSafeState = true;
		this.isAttacked = false;

		this.addHPBar();

		this.onHit( 'Bullet', function( bullets ) {
			var damage = 0, bullet;
			for ( var i in bullets ) {
				bullet = bullets[i].obj;
				if ( this.groupId === bullet.groupId ) {
					continue;
				}
				damage += bullet.damage;
			}

			if ( damage === 0 ) {
				return;
			}

			var attackerId = bullet.owner;
			this.hurt( damage, attackerId );
		});

		this.bind( 'BeAttacked', function( data ) {
			if ( data.attackerId === this.getId() ) {
				return;
			}

			if ( data.targetId !== this.getId() ) {
				return;
			}

			if ( Crafty( data.attackerId ).groupId === this.groupId ) {
				return;
			}

			if ( Crafty( data.attackerId ).leader === this.getId() ) {
				return;
			}

			var damage = data.damage;
			if ( this.damageEnough( damage, this.maxHP / 20 ) ) {
				log( this.getId() + ' be attacked, need to save attackerId:' + data.attackerId );
				this.isAttacked = true;
				this.isSafeState = ! this.isInWarningState();
				Crafty.trigger( 'BaseBuildingBeAttacked', data );

			} else {
				this.isAttacked = false;

			}
		});

		// 每秒回血
		this.cureHP = 20;

		this._cureHandle = setInterval( function() {
			if ( _this.HP < _this.maxHP ) {
				_this.changeHP( _this.cureHP );
			}
		}, 1000 );

		this._destroy = this._destroy_override;
	},

	isInWarningState : function() {
		return this.HP / this.maxHP < 0.7;
	},

	isInDangerState : function() {
		return this.HP / this.maxHP < 0.2;
	},

	setGroupId : function( groupId ) {
		this.groupId = groupId;
		this.text( 'B' + groupId )
			.attr( { w:this.size, h:this.size } );
	},

	// @Override
	_destroy_override : function() {
		if ( this._cureHandle ) {
			clearInterval( this._cureHandle );
		}
		Crafty.trigger( 'BaseBuildingDestroy', this );
	}


});

