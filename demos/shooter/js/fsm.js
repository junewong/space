
/**
 * 战士的有限状态机，用于控制其行为
 */
Crafty.c( "ActorFsm", {

	initFsm: function() {
		var _this = this;

		var fsm = StateMachine.create({

			initial: 'free',

			error: function(eventName, from, to, args, errorCode, errorMessage) {
			  return 'event ' + eventName + ' was naughty :- ' + errorMessage;
			},

			events: [
				{ name: 'nothingToDo', from: 'free', to: 'wand' },
				{ name: 'meetEnemy', from: ['wand', 'free', 'seek'], to: 'attack' },
				{ name: 'killEnemy', from: ['attack', 'seek'], to: 'free' },
				{ name: 'enemyTryEscape', from: ['attack', 'seek'], to: 'seek' },
				{ name: 'enemyLost', from: 'seek', to: 'free' },
				{ name: 'beAttacked', from: ['free', 'wand', 'attack', 'seed', 'alongPath'], to: 'shun' },
				{ name: 'beBlocked', from: ['wand', 'shun', 'free'], to: 'alongPath' },
				{ name: 'beStopMovement', from: ['wand', 'shun'], to: 'free' },
				{ name: 'wandOver', from: 'wand', to: 'free' },
				{ name: 'attackOver', from: 'attack', to: 'free' },
				{ name: 'shunOver', from: 'shun', to: 'free' },
				{ name: 'pathOver', from: 'alongPath', to: 'free' }
			],

			callbacks: {

				/** === 事件：=== */

				/**
				 *
				 */
				onbeStopMovement : function( event, from, to ) {
					log( 'id:' + _this.getId() + ' on event:' + event + ', from:' + from + ', to:' + to );
					this.wanding = false;
					this.shuning = false;
				},

				onbeAttacked : function( event, from, to, entity ) {
					// 一定概率采取还击
					/*
					if ( randInt( 1, 8 ) === 8 ) {
						this.meetEnemy( entity );
					}
					*/
				},

				/**
				 * 躲避结束
				 */
				onshunOver : function( event, from, to ) {
					log( 'id:' + _this.getId() + ' on event:' + event + ', from:' + from + ', to:' + to );
					this.shuning = false;
				},


				/** === 状态：=== */

				/**
				 * 空闲
				 */
				onfree : function( event, from, to ) {
					log( 'id:' + _this.getId() + ' event:' + event + ', from:' + from + ', to:' + to );

					// 医疗技能，掉一半血以下考虑释放治疗技能
					if ( randInt( 1, 10 ) === 1 ) {
						if ( _this.HP / _this.maxHP <= 0.5 ) {
							_this.switchSkillWithType( SKILL_TYPE_CURE );
							_this.executeSkill();
						}
					}

					// 可能会释放召唤技能
					if ( randInt( 1, 25 ) === 1 ) {
						_this.switchSkillWithType( SKILL_TYPE_CALL );
						_this.executeSkill();
					}

					setTimeout( function() {
						fsm.nothingToDo();
					}, 300);
				},

				/**
				 * 漫步
				 */
				onwand: function( event, from, to ) {
					log( 'id:' + _this.getId() + ' event:' + event + ', from:' + from + ', to:' + to );

					if ( this.wanding ) {
						log( 'wanding, pass.' );
						return;
					}
					console.log( 'on wand...');

					var pos = _this.randPositionByAngle( _this.rotation - 90, _this.rotation + 90, randInt( 20, CANVAS_WIDTH /2 ) );
					log( 'id: ' + _this.getId() + ' try to random pos x:' + pos.x + ', pos.y:' + pos.y );///

					this.wanding = true;

					_this.rotateAndMoveTo( pos, true, function() {
						fsm.wanding = false;
						if ( fsm.transition ) {
							fsm.transition();
						}
						log( 'id: ' + _this.getId() + ' try to wand over.' );///
						fsm.wandOver();
					});

					//return StateMachine.ASYNC;
				},

				/**
				 * 发起攻击
				 */
				onattack: function( event, from, to, entity ) {
					log( 'id:' + _this.getId() + ' event:' + event + ', from:' + from + ', to:' + to );

					_this.stopTweenMove();

					var count = randInt( 10, 30 );

					var run = function() {
						if ( fsm.current !== to ) {
							fsm.nothingToDo();
							return;
						}
						if ( ! isLiving( entity ) ) {
							fsm.killEnemy();
							return;
						}

						if ( count <= 0 ) {
							setTimeout( function() {
								fsm.attackOver();
							}, 100 );
							return;
						}

						// 一定几率释放攻击技能
						var hasSkill = false;
						if ( randInt( 0, 30 ) === 10 ) {
							hasSkill = _this.switchSkillWithType( SKILL_TYPE_ATTACK );
							_this.executeSkillTo( entity );
						}

						if ( ! hasSkill ) {
							_this.attackTo( entity );
						}

						count --;

						setTimeout( run, 100 );
					};
					run();
				},

				/**
				 * 追踪敌人
				 */
				onseek: function( event, from, to, entity ) {
					log( 'id:' + _this.getId() + ' event:' + event + ', from:' + from + ', to:' + to );
					if ( ! entity ) {
						fsm.nothingToDo();
						return;
					}

					// 可能会释放召唤技能
					if ( randInt( 1, 5 ) === 1 ) {
						_this.switchSkillWithType( SKILL_TYPE_CONTROL );
						_this.executeSkill();
					}

					// 一定几率释放移动技能
					var hasSkill = false;
					if ( randInt( 1, 5 ) === 1 ) {
						hasSkill = _this.switchSkillWithType( SKILL_TYPE_MOVE );
						_this.executeSkillTo( entity );
					}

					var time = _this.rotateAndMoveTo( {x:entity.x, y:entity.y}, true, function()  {
						var distance = Crafty.math.distance( _this.x, _this.y, entity.x, entity.y );
						if ( distance > _this.visibleDistance * 1.5 ) {
							if ( fsm.transition ) {
								fsm.transition();
							}
							fsm.enemyLost();

						} else {
							if ( fsm.transition ) {
								fsm.transition();
							}

							if ( ! entity || entity.isDead ) {
								fsm.killEnemy();
							} else {
								fsm.enemyTryEscape( entity );
							}
						}
					});
					//return StateMachine.ASYNC();
				},

				/**
				 * 躲避
				 */
				onshun: function( event, from, to, attackerId  ) {
					log( 'id:' + _this.getId() + ' event:' + event + ', from:' + from + ', to:' + to );

					if ( this.shuning ) {
						return;
					}

					if ( attackerId === undefined ) {
						fsm.shunOver();
						return;
					}

					var attacker = Crafty( attackerId );
					if ( ! attacker ) {
						fsm.shunOver();
						return;
					}

					// 医疗技能，掉一半血以下考虑释放治疗技能
					if ( randint( 1, 4 ) === 1 ) {
						if ( _this.hp / _this.maxhp <= 0.5 ) {
							_this.switchskillwithtype( skill_type_cure );
							_this.executeskill();
						}
					}

					// 一定几率释放防御技能
					var hasSkill = false;
					if ( randInt( 1, 3 ) === 1 ) {
						hasSkill = _this.switchSkillWithType( SKILL_TYPE_DEFENSE );
						_this.executeSkill();
					}

					// 有防御技能则不需要躲避了
					if ( hasSkill ) {
						setTimeout( function() {
							fsm.shunOver();
						}, 500 );
						return;
					}

					// 可能会释放控制技能阻挡对手，有利于逃跑
					if ( randInt( 1, 25 ) === 1 ) {
						_this.switchSkillWithType( SKILL_TYPE_CONTROL );
						_this.executeSkill();
					}

					// 普通情况,进行躲避：

					var distance = ranInt( 100, 200 );

					var seed = randInt( 1, 3 );

					this.shuning = true;

					if ( seed === 0 ) {
						log( 'id: ' + this.getId() + ' shun, try to go back, distance:  ' +  distance );///
						_this.goBack( distance, true, function() {
							if ( fsm.transition ) {
								fsm.transition();
							}
							fsm.shunOver();
						} );

					} else {
						var rad = Math.atan2( attacker.x - _this.x, _this.y - attacker.y );
						var angle = Crafty.math.radToDeg( rad );
						angle += ( seed * 90 );

						var pos = fixPos( toAngle( _this.x, _this.y, angle, distance ), _this.w, _this.h );
						log( 'id: ' + _this.getId() + ' shun, try to move to x:' +  pos.x + ' y:'  + pos.y );///

						if ( ! hasSkill ) {
							_this.rotateAndMoveTo( pos, true, function() {
								if ( fsm.transition ) {
									fsm.transition();
								}
								fsm.shunOver();
							});
						}
					}

					//return StateMachine.ASYNC;
				},

				/**
				 * 选择一条路径朝目标走去
				 */
				onalongPath: function( event, from, to, paths ) {
					log( 'id:' + _this.getId() + ' event:' + event + ', from:' + from + ', to:' + to );

					if ( ! paths || paths.length === 0 ) {
						wandOver();
						return 0;
					}

					_this.stopTweenMove();

					_this.searchingPath = true;

					if ( randInt( 1, 20 ) === 1 ) {
						hasSkill = _this.switchSkillWithType( SKILL_TYPE_MOVE );
						_this.executeSkillTo( entity );
					}

					var i = 0;

					var run = function() {
						var path = paths[i];
						if ( ! path ) {
							log( 'No path to walk.' );
							_this.searchingPath = false;
							wandOver();
							return 0;
						}
						//log( 'next path, i:' + i + ' path:' + path );///
						var time = _this.rotateAndMoveTo( path, true, function() {
							i++;
							if ( i >= paths.length - 1 ) {
								_this.searchingPath = false;
								fsm.pathOver();

							} else {
								run();
							}
						});

						// 保护措施，如果是预计时间内还没有完成
						// 可能有意外(比如被卡住），此时强制停止
						if ( i === 0 && time > 0 ) {
							var totalTime = time * ( paths.length + 1 );
							setTimeout( function() {
								if ( _this.searchingPath ) {
									_this.searchingPath = false;
									fsm.pathOver();
									return;
								}
							}, totalTime );

						}

					};
					run();
				},

				onleavealongPath: function( event, from, to, paths ) {
					_this.searchingPath = false;
				}
			}

		});

		this.fsm = fsm;
	}

});
