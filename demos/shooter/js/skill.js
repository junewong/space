// 攻击类型
var SKILL_TYPE_ATTACK = 1;
// 防御类型
var SKILL_TYPE_DEFENSE = 2;
// 治疗类型
var SKILL_TYPE_CURE = 3;
// 移动类型
var SKILL_TYPE_MOVE = 4;
// 控制类型
var SKILL_TYPE_CONTROL = 4;
// 召唤类型
var SKILL_TYPE_CALL = 5;
// 召唤类型
var SKILL_TYPE_PENETRATE = 6;

var Skill = function( name, owner, group, config ) {
	this.name = name;

	this.owner = owner;
	this.group = group;
	this.total = 0;

	this.running = false;

	this.config = extend( {
		// 类型，可以是数组或者数字
		type : null,
		// 不能在该类型触发
		notInType : null,
		max : 10,
		description: '',
		distance : 300,
		time : 1000,
		bulletSize : 4,
		damage : 2,
		// 是否显示技能名称
		showName : true,
		// 是否需要指定目标地址
		needTarget : false,
		// 持续时间
		effectTime : 0,
		// 技能冷却时间
		frozenTime : 3000,
		// 检查是否符合使用技能要求
		check : function() { return true; },
		// 释放技能
		shoot : function() {}

	}, config || {} );

	this.shootTo = function( x, y, rotation, targetX, targetY ) {
		if ( this.running ) {
			return;
		}
		this.running = true;

		if ( this.config.needTarget ) {
			if ( ! this.config.check( x, y, rotation, targetX, targetY ) ) {
				this.running = false;
				return;
			}
		} else {
			if ( ! this.config.check( x, y, rotation ) ) {
				this.running = false;
				return;
			}
		}

		if ( this.config.showName ) {
			this.showSkillName( x, y );
		}

		var _this = this;

		var callback = function() {
			setTimeout( function() {
				_this.running = false;
			}, _this.config.frozenTime );
		};

		if ( this.config.needTarget ) {
			return this.config.shoot( x, y, rotation, targetX, targetY, callback );

		} else {
			return this.config.shoot( x, y, rotation, callback );
		}
	};

	this.isEnabled = function() {
		return ! this.running;
	};

	this.isRunning = function() {
		return this.running;
	};

	this.isOwner = function( bullet ) {
		return this.owner === bullet.owner;
	};

	// 是否属于某种类型的技能
	this.isType = function( type ) {
		if ( this.config.type instanceof Array ) {
			for ( var i in this.config.type ) {
				if ( this.config.type[ i ] === type ) {
					return true;
				}
			}
			return false;

		} else {
			return this.config.type === type;
		}
	};

	var _this = this;

	this.showSkillName = function( x, y, color ) {
		color = color || 'black';
		showTip( _this.name, x, y );

	};
};

/**
 * 技能：烈日光辉
 * AOE类型攻击
 */
var SunShineSkill = function( owner, group ) {

	var config = {

		type : SKILL_TYPE_ATTACK,
		notInType : SKILL_TYPE_DEFENSE,
		description: '大范围攻击技能',
		distance : 200,
		damage: 5,
		circleCount : 24,
		time : 1000,
		frozenTime : 8000,

		shoot : function( x, y, rotation, callback ) {
			var _this = this;

			var j = this.max;

			var offset = this.circleCount / 3;

			function run() {

				for ( var i = 0; i < _this.circleCount; i++ ) {
					var r = 360 * i / _this.circleCount + ( j * offset );

					var point = toAngle( x, y, r, _this.distance );

					Crafty.e( 'Bullet' )
						.attr( { x:x, y:y, w:_this.bulletSize, h:_this.bulletSize, alpha:1, owner:owner, group: group, damage: _this.damage } )
						.origin( this.w /2, this.height /2 )
						.tween( {x: point.x, y:point.y, alpha:0.3}, _this.time )
						.one( 'TweenEnd', function() {
							this.destroy();
						})
						.onHit( "BaseBuilding", function() {
							this.destroy();
						})
						.onHit( "Obstacle", function() {
							this.destroy();
						})
						.onHit( "SkillObstacle", function() {
							this.destroy();
						})
						.onHit( "Bullet", function() {
							this.destroy();
						});
				}

				if ( j > 0 ) {
					setTimeout( run, 120 );
					j--;
				} else {
					callback();
				}
			}

			run();

		}
	};

	return new Skill( '烈日', owner, group, config );
};


/**
 * 护盾技能，一定时间之内免受伤害
 */
var SheildSkill = function( owner, group ) {

	var config = {

		type : SKILL_TYPE_DEFENSE,
		description: '在一定时间免除伤害',
		distance : 250,
		damage: 8,
		circleCount : 24,
		time : 1000,
		effectTime : 6,
		frozenTime : 6000,

		shoot : function( x, y, rotation, callback ) {
			var _this = this;

			var actor = Crafty( owner );
			if ( ! actor || ! actor.length ) {
				return;
			}

			var size = actor.w * 4;
			var sx = actor.x + actor.w/2 - size/2;
			var sy = actor.y + actor.h/2 - size/2;

			var sheild = Crafty.e( '2D, Canvas, Color, Collision, Tween, SkillObstacle' )
								.origin( size/2, size/2 )
								.attr( {x: sx, y: sy, w: size, h: size, rotation: actor.rotation, alpha:0.45, owner: owner} )
								.color( 'yellow' );

			actor.attach( sheild );

			// remove:
			setTimeout( function() {
				actor.detach( sheild );
				sheild.tween( { alpha: 0 }, 300 )
					.one( 'TweenEnd', function ( e ) {
						sheild.destroy();
						callback();
					});

			}, _this.effectTime * 1000);

		}
	};

	return new Skill( '守护', owner, group, config );
};

/**
 * 减缓速度
 */
var MarshSkill = function( owner, group ) {

	var config = {

		type : SKILL_TYPE_CONTROL,
		description: '释放一个沼泽让敌人减慢行走速度',
		distance : 150,
		damage: 0,
		time : 1000,
		bufSpeed : -15,
		effectTime : 8,
		frozenTime : 4000,

		shoot : function( x, y, rotation, callback ) {
			var _this = this;

			var actor = Crafty( owner );
			if ( ! actor || ! actor.length ) {
				return;
			}

			var size = this.distance * 2;

			var x0 = actor.x + actor.w/2;
			var y0 = actor.y + actor.h/2;

			var x1 = actor.x + actor.w/2 - this.distance;
			var y1 = actor.y + actor.h/2 - this.distance;

			var hit = function( e ) {
				for ( var i = 0; i < e.length; i ++ ) {
					var entity  = e[i].obj;
					if ( ! entity || entity.getId() === owner || entity.group === group ) {
						return;
					}
					// 不重复debuf
					if ( entity.buffers.speed < 0 ) {
						return;
					}
					// debuf:
					new Buffer( 'speed', _this.bufSpeed,  _this.effectTime ).appendTo( entity );
				}
			};

			var marsh = Crafty.e( '2D, Canvas, Color, Collision, Tween' )
								.attr( {x: x0, y: y0, w: 0, h: 0, alpha:0.40, owner: owner} )
								.color( 'brown' )
								.onHit( 'Player',  hit )
								.onHit( 'Soldier',  hit )
								.tween( { x: x1, y: y1, w: size, h: size }, _this.time );

			// remove:
			setTimeout( function() {
				marsh.tween( { alpha: 0 }, 300 )
					.one( 'TweenEnd', function ( e ) {
						marsh.destroy();
						callback();
					});

			}, _this.effectTime * 1000);

		}
	};

	return new Skill( '沼泽', owner, group, config );
};

/**
 * 快速瞬移到指定地方，几秒后返回
 */
var SneakSkill = function( owner, group ) {

	var config = {

		type : [ SKILL_TYPE_MOVE, SKILL_TYPE_ATTACK ],
		description: '快速瞬移到鼠标右键指定地方，几秒后瞬移返回原点',
		needTarget : true,
		distance : 500,
		damage: 0,
		effectTime : 2,
		frozenTime : 3000,

		check : function( x, y, rotation, targetX, targetY ) {
			if ( ! targetX && ! targetY ) {
				return;
			}
			var distance = Crafty.math.distance( x, y, targetX, targetY );
			return distance < this.distance;
		},

		shoot : function( x, y, rotation, targetX, targetY, callback ) {
			if ( ! targetX && ! targetY ) {
				callback();
				return;
			}

			var _this = this;

			var actor = Crafty( owner );
			if ( ! actor || ! actor.length ) {
				callback();
				return;
			}

			var x0 = actor.x;
			var y0 = actor.y;

			var move = function( x, y, targetX, targetY, doneCallback ) {
				actor.stopTweenMove();

				setTimeout( function() {
					// 渐隐
					actor.tween( { alpha: 0 }, 500 )
						.one( 'TweenEnd', function ( e ) {
							// 瞬移到目标处
							actor.attr( {x: targetX, y: targetY } )
								// 渐现
								.tween( { alpha: 1 }, 500 )
								.one( 'TweenEnd', function ( e ) {
									doneCallback();
								});
						});
				}, 100 );
			}; 


			// 瞬移过去
			move( x0, y0, targetX, targetY, function() {
				setTimeout( function() {
					// 瞬移回原点
					move( actor.x, actor.y, x0, y0, function() {
						callback();
					});
				}, _this.effectTime * 1000 );
			});



		}
	};

	return new Skill( '潜行', owner, group, config );
};

/**
 *  医疗技能
 */
var CuteSkill = function( owner, group ) {

	var config = {

		type : SKILL_TYPE_CURE,
		description: '绿色光环范围内，能治疗自己或团队',
		distance : 90,
		damage: 0,
		time : 1000,
		value : 1,
		effectTime : 4,
		frozenTime : 30000,

		shoot : function( x, y, rotation, callback ) {
			var _this = this;

			var actor = Crafty( owner );
			if ( ! actor || ! actor.length ) {
				return;
			}

			var hit = function( e ) {
				for ( var i = 0; i < e.length; i ++ ) {
					var entity  = e[i].obj;
					if ( ! entity || ( entity.getId() !== owner && entity.group !== actor.group ) ) {
						continue;
					}
					entity.changeHP( _this.value );
				}
			};

			var run = function() {
				var x0 = actor.x + actor.w/2;
				var y0 = actor.y + actor.h/2;

				var x1 = actor.x + actor.w/2 - _this.distance;
				var y1 = actor.y + actor.h/2 - _this.distance;

				var size = _this.distance * 2;

				var cuteMask = Crafty.e( '2D, Canvas, Color, Collision, Tween' )
									.attr( {x: x0, y: y0, w: 0, h: 0, alpha:0.35, owner: owner} )
									.color( 'green' )
									.onHit( 'Player',  hit )
									.onHit( 'Soldier',  hit )
									.tween( { x: x1, y: y1, w: size, h: size }, _this.time )
									.one( 'TweenEnd', function ( e ) {
										cuteMask.tween( { alpha: 0 }, 600 )
											.one( 'TweenEnd', function ( e ) {
												cuteMask.destroy();
											});
									});
			};

			var handler = setInterval( run, _this.time );

			// remove:
			setTimeout( function() {
				clearInterval( handler );
				callback();
			}, _this.effectTime * 1000);

		}
	};

	return new Skill( '春风', owner, group, config );
};


/**
 * 破甲
 */
var PenetrateSkill = function( owner, group ) {

	var config = {

		type : [ SKILL_TYPE_ATTACK, SKILL_TYPE_PENETRATE ],
		description: '无视对方防御，造成穿透攻击',
		distance : 600,
		damage: 25,
		time : 450,
		frozenTime : 1500,

		shoot : function( x, y, rotation, callback ) {
			var _this = this;

			var actor = Crafty( owner );
			if ( ! actor || ! actor.length ) {
				return;
			}

			var point = toAngle( x, y, actor.rotation, _this.distance );

			Crafty.e( 'Bullet' )
				.attr({ x:x, y:y, w:4, h: 40, rotation: actor.rotation, alpha:0.9, owner:owner, group: group, damage: _this.damage } )
				.color( 'orange' )
				.tween( {x: point.x, y:point.y, alpha:0.3}, _this.time )
				.one( 'TweenEnd', function() {
					this.destroy();
					callback();
				});

		}
	};

	return new Skill( '破甲', owner, group, config );
};

/**
 * 冲锋
 */
var DashSkill = function( owner, group ) {

	var config = {

		type : [ SKILL_TYPE_MOVE, SKILL_TYPE_ATTACK ],
		description: '快速冲上去，把敌人都撞开',
		needTarget : true,
		distance : 350,
		damage: 12,
		time : 150,
		dash : 40,
		bufSpeed : 40,
		effectTime : 0.3,
		frozenTime : 2000,

		check : function( x, y, rotation, targetX, targetY ) {
			if ( ! targetX && ! targetY ) {
				return;
			}
			var distance = Crafty.math.distance( x, y, targetX, targetY );
			return distance < this.distance;
		},

		shoot : function( x, y, rotation, targetX, targetY, callback ) {
			var _this = this;

			var actor = Crafty( owner );
			if ( ! actor || ! actor.length ) {
				callback();
				return;
			}

			var size = actor.w * 3;
			var sx = actor.x + actor.w/2 - size/2;
			var sy = actor.y + actor.h/2 - size/2;

			var distance = Crafty.math.distance( x, y, targetX, targetY );
			var point = toAngle( x, y, actor.rotation, distance );
			var dash = _this.dash + ( distance / _this.dash ) * 5;

			var bullet = Crafty.e( 'Bullet, SkillObstacle' )
						.attr( {x: sx, y: sy, w: size, h: size, rotation: actor.rotation, alpha:0.45,
							owner: owner, group: group,
							damage: _this.damage, dash: dash, running: false } )
						.origin( size/2, size/2 )
						.color( 'red' );

			actor.attach( bullet );

			new Buffer( 'speed', _this.bufSpeed,  _this.effectTime ).appendTo( actor );

			var time = actor.rotateAndMoveTo( point, true ); 

			// remove:
			setTimeout( function() {
				bullet.hit( 'Actor' );
				bullet.destroy();
				callback();
			}, time + 300 );

		}
	};

	return new Skill( '冲锋', owner, group, config );
};

/**
 * 加快行走速度
 */
var SpeedUpSkill = function( owner, group ) {

	var config = {

		type : SKILL_TYPE_MOVE,
		description: '加快自己的移动速度',
		damage: 0,
		bufSpeed : 16,
		effectTime : 3,
		frozenTime : 3000,

		shoot : function( x, y, rotation, callback ) {
			var _this = this;

			var actor = Crafty( owner );
			if ( ! actor || ! actor.length ) {
				callback();
				return;
			}

			new Buffer( 'speed', _this.bufSpeed,  _this.effectTime, function() {
					callback();
			} ).appendTo( actor );

		}
	};

	return new Skill( '飞燕', owner, group, config );
};


/**
 * 召唤一个士兵
 */
var ServantSkill = function( owner, group ) {

	var config = {

		type : SKILL_TYPE_CALL,
		description: '召唤一个士兵',
		frozenTime : 3000,
		maxCount : 1,

		check : function( x, y, rotation, callback ) {
			var count = 0;
			Crafty( 'Servant' ).each( function() {
				if ( this.leader === owner ) {
					count ++;
				}
			});

			return  count < this.maxCount;
		},

		shoot : function( x, y, rotation, callback ) {
			var _this = this;

			var actor = Crafty( owner );
			if ( ! actor || ! actor.length ) {
				callback();
				return;
			}

			//Crafty.trigger( 'CallServant', actor );
			Game._createServant( actor );

			callback();

		}
	};

	return new Skill( '召唤', owner, group, config );
};

/**
 * 召唤多个炮灰型士兵, 血量少，没有技能，攻击力弱，一段时间后消失。
 */
var WeakServantSkill = function( owner, group ) {

	var config = {

		type : SKILL_TYPE_CALL,
		description: '召唤多个炮灰型士兵',
		effectTime : 30000,
		frozenTime : 10000,
		max : 3,
		maxCount : 9,

		check : function( x, y, rotation, callback ) {
			var count = 0;
			Crafty( 'WeakServant' ).each( function() {
				if ( this.leader === owner ) {
					count ++;
				}
			});

			return  count < this.maxCount;
		},

		shoot : function( x, y, rotation, callback ) {
			var _this = this;

			var actor = Crafty( owner );
			if ( ! actor || ! actor.length ) {
				callback();
				return;
			}
			var destroy = function( actor ) {
				setTimeout( function() {
					if ( actor ) {
						die( actor );
					}
				}, _this.effectTime);
			};

			for ( var i = 0; i < this.max; i ++ ) {
				var servant = Game._createServant( actor, 'WeakServant' );
				destroy( servant );
			}

			callback();
		}
	};

	return new Skill( '群狼', owner, group, config );
};


var SKILL_LIST = [ SunShineSkill, SheildSkill, MarshSkill, SneakSkill, CuteSkill, PenetrateSkill, DashSkill, SpeedUpSkill, ServantSkill, WeakServantSkill ];


/**
 * Buf属性
 */
var Buffer = function( property, value, timeout, callback ) {
	this.property = property;
	this.value = value;
	this.timeout = timeout;

	var _this = this;

	this.appendTo = function( actor ) {
		if ( actor.buffers[ property ] === undefined ) {
			log( 'Buffer error, no buffers property found: ' + property  + ' for acotr, id: ' + actor.getId() );
			return;
		}

		actor.buffers[ property ] += value;

		log( 'actor, id: ' + actor.getId() + ' add buffer for ' + property + ' as: ' + actor.buffers[ property ] + ' now.' );

		if ( this.timeout > 0 ) {
			setTimeout ( function() {
				actor.buffers[ property ] -= value;
				log( 'actor, id: ' + actor.getId() + ' remove buffer for ' + property + ' as: ' + actor.buffers[ property ] + ' now.' );
				if ( callback ) {
					callback();
				}
			}, this.timeout * 1000 );
		}
	};

};


Crafty.c( "Skill", {
	init: function( config ) {
		// 技能
		this.skills = [];
		this.skill = null;
		this.index = 0;
	},

	/**
	 * 切换技能
	 * @param index : 索引或者技能对象
	 */
	switchSkill : function( index ) {
		if ( index === undefined ) {
			return;
		}
		if ( typeof index === 'number' ) {
			if ( index < 0 || index >= this.skills.length ) {
				return;
			}
			this.skill = this.skills[ index ];

		} else {
			var skill = index;
			this.skill = skill;
		}
		this.index = index;
	},

	nextSkill : function() {
		var index = this.index < this.skills.length -1 ? this.index + 1 : 0;
		this.switchSkill( index );
	},

	addSkill : function( skillClass ) {
		var skill = new skillClass( this.getId(), this.group );
		this.skills.push( skill );
		if ( ! this.skill ) {
			this.skill = skill;
		}
	},

	hasEnableSkillWithType : function( type ) {
		return !! this.getSkillWithType( type );
	},

	getSkillWithType : function( type ) {
		if ( ! this.skills ) {
			return null;
		}

		var options = [];
		for ( var i in this.skills ) {
			var skill = this.skills[i];
			if ( skill.isType( type ) && skill.isEnabled() ) {
				if ( skill.config.notInType && this.isRunningWithType( skill.config.notInType ) ) {
					continue;
				}
				options.push( skill );
			}
		}

		if ( options.length === 1 ) {
			return options[ 0 ];
		}

		// 从合适的技能中随机抽取一个
		if ( options.length > 1 ) {
			return Crafty.math.randomElementOfArray( options );
		}

		return null;
	},

	switchSkillWithType : function( type ) {
		var skill = this.getSkillWithType( type );
		if ( ! skill ) {
			return false;
		}
		this.switchSkill( skill );
		return true;
	},

	/**
	 * 根据类型选择可用的技能
	 *
	 * @return 如果有则返回true，否则返回false
	 */
	shootWithType : function( type, x, y, rotation, targetX, targetY  ) {
		var skill = this.getSkillWithType( type );
		if ( ! skill ) {
			return false;
		}

		skill.shootTo( x, y, rotation, targetX, targetY );
		return true;
	},

	/**
	 * 是否处于执行难某种技能的状态当中
	 */
	isRunningWithType : function( type ) {
		if ( ! this.skills ) {
			return false;
		}
		for ( var i in this.skills ) {
			var skill = this.skills[i];
			if ( skill.isRunning() && skill.isType( type ) ) {
				return true;
			}
		}
		return false;
	},

	/**
	 * 获取所有技能名称的字符串
	 */
	getSkillString : function() {
		var names = [];
		for ( var i in this.skills ) {
			names.push( this.skills[i].name );
		}
		return 'Actor(' + this.getId() + ') 技能：' + names.join( ',' );
	}

});
