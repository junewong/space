
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
				{ name: 'enemyTryEscape', from: ['attack', 'seek'], to: 'free' },
				//{ name: 'enemyTryEscape', from: ['attack', 'seek'], to: 'seek' },
				//{ name: 'enemyLost', from: 'seek', to: 'free' },
				//{ name: 'beAttacked', from: ['free', 'wand', 'attack', 'seed', 'alongPath'], to: 'defense' },
				{ name: 'beAttacked', from: ['free', 'wand', 'attack', 'seed', 'alongPath'], to: 'shun' },
				//{ name: 'attackNotEffect', from: 'attack', to: 'shun' },
				//{ name: 'beBlocked', from: ['wand', 'shun', 'free'], to: 'alongPath' },
				{ name: 'beStopMovement', from: ['wand', 'shun', 'alongPath' ], to: 'free' },
				{ name: 'wandOver', from: ['wand', 'alongPath'], to: 'free' },
				{ name: 'attackOver', from: 'attack', to: 'free' },
				//{ name: 'defenseOver', from: 'defense', to: 'free' },
				{ name: 'shunOver', from: 'shun', to: 'free' },
				//{ name: 'pathOver', from: 'alongPath', to: 'free' }
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
					if ( randInt( 1, 8 ) === 8 ) {
						this.meetEnemy( entity );
					}
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
					this.nothingToDo();

				},

				/**
				 * 漫步
				 * 朝对方杀过去
				 */
				onwand: function( event, from, to ) {
					log( 'id:' + _this.getId() + ' event:' + event + ', from:' + from + ', to:' + to );

					if ( this.wanding ) {
						log( 'wanding, pass.' );
						return;
					}
					log( 'on wand...');

					var pos = getNearbyTargetBulidingPos( _this );
					if ( ! pos ) {
						log( 'id: ' + _this.getId() + ' could not get nearby building ! ');///
						return;
					}
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
							if ( entity && Math.random() < 0.9 && _this.visibleFrame.intersect( rect( entity ) ) ) {
								count = randInt( 10, 30 );

							} else {
								fsm.attackOver();
								return;
							}
						}


						//if ( _this.moving ) {
							_this.stopTweenMove();
						//}

						_this.attackTo( entity );

						count --;

						setTimeout( run, 100 );
					};
					run();
				},

				/**
				 * 应战
				 */
				ondefense : function( event, from, to, attackerId ) {
					var attacker = Crafty( attackerId );
					if ( attacker && randInt( 1, 8 ) < 5 ) {
						_this.stopTweenMove();
						this.meetEnemy( attacker );
					} else {
						this.defenseOver();
					}
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

					// 可能会释放控制技能
					if ( randInt( 1, 5 ) === 1 ) {
						if ( _this.switchSkillWithType( SKILL_TYPE_CONTROL ) ) {
							_this.executeSkill();
						}
					}

					// 一定几率释放移动技能
					var hasSkill = false;
					if ( randInt( 1, 4 ) === 1 ) {
						hasSkill = _this.switchSkillWithType( SKILL_TYPE_MOVE );
						if ( hasSkill ) {
							_this.executeSkillTo( entity );
						}
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

					// 不重复执行
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


					// 普通情况,进行躲避：

					var distance = randInt( 30, 100 );

					var seed = randInt( -1, 1 );

					this.shuning = true;

					var time = 0;
					if ( seed === 0 ) {
						log( 'id: ' + _this.getId() + ' shun, try to go back, distance:  ' +  distance );///
						time = _this.goBack( distance, true );

					} else {
						var rad = Math.atan2( attacker.x - _this.x, _this.y - attacker.y );
						var angle = Crafty.math.radToDeg( rad );
						angle += ( seed * 90 );

						var pos = fixPos( toAngle( _this.x, _this.y, angle, distance ), _this.w, _this.h );
						log( 'id: ' + _this.getId() + ' shun, try to move to x:' +  pos.x + ' y:'  + pos.y );///

						time = _this.rotateAndMoveTo( pos, true );
					}

					setTimeout( function() {
						if ( fsm.transition ) {
							fsm.transition();
						}
						fsm.shunOver();
					}, time );


					//return StateMachine.ASYNC;
				},

				/**
				 * 选择一条路径朝目标走去
				 */
				onalongPath: function( event, from, to, paths ) {
					log( 'id:' + _this.getId() + ' event:' + event + ', from:' + from + ', to:' + to );

					if ( ! paths || paths.length === 0 ) {
						fsm.wandOver();
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
							fsm.wandOver();
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
