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

var Skill = function( name, owner, group, config ) {
	this.name = name;

	this.owner = owner;
	this.group = group;
	this.total = 0;

	this.running = false;

	this.config = extend( {
		max : 10,
		description: '',
		distance : 300,
		time : 1000,
		bulletSize : 4,
		damage : 2,
		showName : true,
		needTarget : false,
		check : function() { return true; },
		shoot : function() {}

	}, config || {} );

	this.shootTo = function( x, y, rotation, targetX, targetY ) {
		if ( this.running ) {
			return;
		}

		if ( this.config.needTarget ) {
			if ( ! this.config.check( x, y, rotation, targetX, targetY ) ) {
				return;
			}
		} else {
			if ( ! this.config.check( x, y, rotation ) ) {
				return;
			}
		}

		this.running = true;
		if ( this.config.showName ) {
			this.showSkillName( x, y );
		}

		var _this = this;

		if ( this.config.needTarget ) {
			return this.config.shoot( x, y, rotation, targetX, targetY, function() {
				_this.running = false;
			});

		} else {
			return this.config.shoot( x, y, rotation, function() {
				_this.running = false;
			});
		}
	};

	this.isOwner = function( bullet ) {
		return this.owner === bullet.owner;
	};

	var _this = this;

	this.showSkillName = function( x, y ) {
		var width = 100, height = 40, offsetX = x - width /2;

		Crafty.e( '2D, Canvas, Color, Tween, Text' )
			.text( _this.name )
			.textFont( { size: '24px', weight: 'bold' } )
			.attr( { x: offsetX, y: y - 10, w:width, h:height, alpha:1 } )
			.tween( {x: offsetX, y: y - 90, alpha:0.4}, 900 )
			.one( 'TweenEnd', function() {
				this.destroy();
			});

	};
};

/**
 * 技能：烈日光辉
 * AOE类型攻击
 */
var SunShineSkill = function( owner, group ) {

	var config = {

		type : SKILL_TYPE_ATTACK,
		description: '大范围攻击技能',
		distance : 250,
		damage: 5,
		circleCount : 24,
		time : 1000,

		shoot : function( x, y, rotation, callback ) {
			var _this = this;

			var j = this.max;

			var offset = this.circleCount / 3;

			function run() {

				for ( var i = 0; i < _this.circleCount; i++ ) {
					var r = 360 * i / _this.circleCount + ( j * offset );

					var point = toAngle( x, y, r, _this.distance );

					Crafty.e( 'Bullet' )
						.attr( { x:x, y:y, w:_this.bulletSize, h:_this.bulletSize, alpha:1, owner:owner, damage: _this.damage } )
						.origin( this.w /2, this.height /2 )
						.tween( {x: point.x, y:point.y, alpha:0.3}, _this.time )
						.one( 'TweenEnd', function() {
							this.destroy();
						})
						.onHit( "Wall", function() {
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

	return new Skill( '烈日光辉', owner, group, config );
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

	return new Skill( '叹息守护', owner, group, config );
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
					if ( ! entity || entity.getId() === owner ) {
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

	return new Skill( '迟缓沼泽', owner, group, config );
};

/**
 * 快速瞬移到指定地方，几秒后返回
 */
var SneakSkill = function( owner, group ) {

	var config = {

		type : SKILL_TYPE_MOVE,
		description: '快速瞬移到鼠标右键指定地方，几秒后瞬移返回原点',
		needTarget : true,
		distance : 500,
		damage: 0,
		effectTime : 2,

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

	return new Skill( '潜行千里', owner, group, config );
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
		effectTime : 5,

		shoot : function( x, y, rotation, callback ) {
			var _this = this;

			var actor = Crafty( owner );
			if ( ! actor || ! actor.length ) {
				return;
			}

			var hit = function( e ) {
				for ( var i = 0; i < e.length; i ++ ) {
					var entity  = e[i].obj;
					if ( ! entity || entity.getId() !== owner ) {
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

	return new Skill( '春风复苏', owner, group, config );
};


/**
 * 破甲
 */
var PenetrateSkill = function( owner, group ) {

	var config = {

		type : SKILL_TYPE_ATTACK,
		description: '无视对方防御，造成穿透攻击',
		distance : 500,
		damage: 25,
		time : 400,

		shoot : function( x, y, rotation, callback ) {
			var _this = this;

			var actor = Crafty( owner );
			if ( ! actor || ! actor.length ) {
				return;
			}

			var point = toAngle( x, y, actor.rotation, _this.distance );

			Crafty.e( 'Bullet' )
				.attr({ x:x, y:y, w:4, h: 40, rotation: actor.rotation, alpha:0.9, owner:owner, damage: _this.damage } )
				.color( 'orange' )
				.tween( {x: point.x, y:point.y, alpha:0.3}, _this.time )
				.one( 'TweenEnd', function() {
					this.destroy();
					callback();
				});

		}
	};

	return new Skill( '黎明破甲', owner, group, config );
};

/**
 * 破甲
 */
var DashSkill = function( owner, group ) {

	var config = {

		type : SKILL_TYPE_MOVE,
		description: '快速冲上去，把敌人都撞开',
		needTarget : true,
		distance : 350,
		damage: 12,
		time : 150,
		dash : 40,
		bufSpeed : 40,
		effectTime : 0.3,

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

			var bullet = Crafty.e( 'Bullet' )
						.attr( {x: sx, y: sy, w: size, h: size, rotation: actor.rotation, alpha:0.45, owner: owner, damage: _this.damage, dash: dash } )
						.origin( size/2, size/2 )
						.color( 'red' );

			actor.attach( bullet );

			new Buffer( 'speed', _this.bufSpeed,  _this.effectTime ).appendTo( actor );

			actor.rotateAndMoveTo( point, true, function() {
				bullet.destroy();
				callback();
			});

		}
	};

	return new Skill( '蛮牛冲锋', owner, group, config );
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

	return new Skill( '身轻如燕', owner, group, config );
};


var SKILL_LIST = [ SunShineSkill, SheildSkill, MarshSkill, SneakSkill, CuteSkill, PenetrateSkill, DashSkill, SpeedUpSkill ];


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

		if ( timeout > 0 ) {
			setTimeout ( function() {
				actor.buffers[ property ] -= value;
				log( 'actor, id: ' + actor.getId() + ' remove buffer for ' + property + ' as: ' + actor.buffers[ property ] + ' now.' );
				if ( callback ) {
					callback();
				}
			}, timeout * 1000 );
		}
	};

};
