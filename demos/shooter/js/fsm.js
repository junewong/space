
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
				{ name: 'beAttacked', from: ['free', 'wand', 'attack', 'seed'], to: 'shun' },
				{ name: 'beBlocked', from: ['wand', 'shun', 'free'], to: 'alongPath' },
				{ name: 'beStopMovement', from: ['wand', 'shun'], to: 'free' },
				{ name: 'wandOver', from: 'wand', to: 'free' },
				{ name: 'attackOver', from: 'attack', to: 'free' },
				{ name: 'shunOver', from: 'shun', to: 'free' },
				{ name: 'pathOver', from: 'alongPath', to: 'free' }
			],

			callbacks: {

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
				 *
				 */
				onshunOver : function( event, from, to ) {
					log( 'id:' + _this.getId() + ' on event:' + event + ', from:' + from + ', to:' + to );
					this.shuning = false;
				},


				/**
				 *
				 */
				onfree : function( event, from, to ) {
					log( 'id:' + _this.getId() + ' event:' + event + ', from:' + from + ', to:' + to );
					setTimeout( function() {
						fsm.nothingToDo();
					}, 300);
				},

				/**
				 *
				 */
				onwand: function( event, from, to ) {
					log( 'id:' + _this.getId() + ' event:' + event + ', from:' + from + ', to:' + to );

					if ( this.wanding ) {
						log( 'wanding, pass.' );
						return;
					}
					console.log( 'on wand...');

					var pos = _this.randPositionByAngle( _this.rotation - 120, _this.rotation + 120, randInt( 20, CANVAS_WIDTH /2 ) );
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
				 *
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

						_this.attackTo( entity );

						count --;

						setTimeout( run, 100 );
					};
					run();
				},

				/**
				 *
				 */
				onseek: function( event, from, to, entity ) {
					log( 'id:' + _this.getId() + ' event:' + event + ', from:' + from + ', to:' + to );
					if ( ! entity ) {
						fsm.nothingToDo();
						return;
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
				 *
				 */
				onshun: function( event, from, to, attackerId  ) {
					log( 'id:' + _this.getId() + ' event:' + event + ', from:' + from + ', to:' + to );

					if ( this.shuning ) {
						return;
					}

					if ( attackerId === undefined ) {
						shunOver();
						return;
					}

					var attacker = Crafty( attackerId );
					if ( ! attacker ) {
						shunOver();
						return;
					}

					//var distance = attacker.getAttackDistance() / 4;
					var distance = 100;

					//var seed = randInt( -1, 1 );
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

						_this.rotateAndMoveTo( pos, true, function() {
							if ( fsm.transition ) {
								fsm.transition();
							}
							fsm.shunOver();
						});
					}

					//return StateMachine.ASYNC;
				},

				/**
				 *
				 */
				onalongPath: function( event, from, to, paths ) {
					log( 'id:' + _this.getId() + ' event:' + event + ', from:' + from + ', to:' + to );

					if ( ! paths || paths.length === 0 ) {
						return 0;
					}

					_this.stopTweenMove();

					_this.searchingPath = true;

					var i = 0;

					var run = function() {
						var path = paths[i];
						if ( ! path ) {
							_this.searchingPath = false;
							log( 'No path to walk.' );
							return 0;
						}
						//log( 'next path, i:' + i + ' path:' + path );///
						_this.rotateAndMoveTo( path, true, function() {
							i++;
							if ( i >= paths.length - 1 ) {
								_this.searchingPath = false;
								fsm.pathOver();

							} else {
								run();
							}
						});
					};
					run();
				}
			}

		});

		this.fsm = fsm;
	}

});
