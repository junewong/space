/**
 * @import base.js dict.js skill.js strategy.js actor.js
 */
var RankWarGame = Class({

	init : function( maxActors, useManual ) {
		this.turns = 0;
		this.step = 1;
		this.maxActors = maxActors || 100;
		this.maxTruns = 20;
		this.deathCount = 0;
		// 是否玩家参与
		this.useManual = useManual === undefined ? true : !!useManual;

		this._isPlaying = false;
		this.handle = null;

		this.gameMode = null;

		this.nextTurnsCallback = null;
		this.nextStepCallback = null;
		this.startCallback = null;
		this.endCallback = null;
		this.fightCallback = null;
		this.fightResultCallback = null;
		this.swapRankCallback = null;
		this.giveUpCallback = null;
		this.hurtCallback = null;
		this.deathCallback = null;

		this.manualActor = null;

		this.maxSkillsInFighting = 3;

		this.rankMap = {};
		this.actors = this._createActors();

		this.maxStep = this.actors.length;


	},

	setMaxTruns : function( maxTruns ) {
		this.maxTruns = maxTruns;
	},

	setMaxStep : function( maxStep ) {
		this.maxStep = ( maxStep <= this.maxActors ) ? maxStep : this.maxActors;
	},

	getAcotrsByRank : function() {
		var _this = this;
		return Arrays.createIndexArray( this.actors.length - 1 ).mapNew( function( index, i ) {
			return _this.rankMap[ index + 1 ];
		});
	},

	getManualActor : function() {
		return this.manualActor;
	},

	setGameMode : function( gameMode ) {
		this.gameMode = gameMode;
	},

	next : function() {

		// 新的一回合
		if ( this.step <= 1 ) {
			this.turns ++;
			this.maxStep = this.actors.length - this.deathCount;
			// 打乱顺序
			this.actors.shuffle();
			if ( this.nextTurnsCallback ) {
				this.nextTurnsCallback( this.turns, this.step );
			}
		}

		// 每个人轮流发起挑战
		var actor = this.actors[ this.step -1 ];

		// 如果已经淘汰，则让位给下一个
		while( actor.isDeath() && this.deathCount < this.actors.length ) {
			this.step ++;
			this.checkEnd();
			if ( this.step <= 1 ) {
				return;
			}
			actor = this.actors[ this.step -1 ];
		}

		// 可交战对手
		var targets = this._getFrontActors( actor );
		if ( targets ) {
			var enemy = actor.strategy.chooseEnemy( targets, actor );
			// 按兵不动
			if ( ! enemy ) {
				actor.strategy.levelUp( actor.skillGroup.skills, SkillRule.getStayPoint() );
				if ( this.giveUpCallback ) {
					this.giveUpCallback( actor, this.turns, this.step);
				}

			} else {
				// 挑战
				this.fight( actor, enemy );
			}
		}

		if ( this.nextStepCallback ) {
			this.nextStepCallback( this.turns, this.step );
		}

		this.step ++;
		this.checkEnd();
	},

	checkEnd : function() {
		if (  this.step >= this.maxStep ) {
			if ( this.gameMode.isGameOver( this ) ) {
				this.pause();
				if ( this.endCallback ) {
					this.endCallback( this.turns );
				}
			}
			this.step = 1;
		}
	},

	play : function() {
		var _this = this;

		this._isPlaying = true;

		// 游戏刚开始
		if ( this.step === 1 && this.turns === 0 ) {
			if ( ! this.gameMode ) {
				this.setGameModel( new PersonalWarGameMode() );
			}

			if ( this.startCallback ) {
				this.startCallback();
			}
		}

		// 继续游戏
		function autoRun() {
			// 获取每次的动画帧
			setTimeout( function() {
				if ( _this._isPlaying ) {
					_this.handle = requestAnimationFrame( autoRun );
					_this.next();
				}
			}, 80 );
		}

		autoRun();
	},

	pause : function() {
		this._isPlaying = false;
		cancelAnimationFrame( this.handle );
		this.handle  = null;
	},

	isPlaying : function() {
		return !! this._isPlaying;
	},

	fight : function( actorA, actorB ) {
		var skillsA = actorA.strategy.fight( actorA.skillGroup, this.maxSkillsInFighting  );
		var skillsB = actorB.strategy.attacked( actorA, actorB.skillGroup, this.maxSkillsInFighting );

		if ( this.fightCallback ) {
			this.fightCallback( actorA, skillsA, actorB, skillsB);
		}

		var logs = [];
		var total = 0, hurt = 0;
		Arrays.mapBoth( skillsA, skillsB, function( a, b, i ) {
			var score = SkillRule.fight( a, b );
			total += SkillRule.getRealScore( score );
			logs.push( SkillRule.getLastFightLog() );
		});

		hurt = -1 * Math.abs( total );

		var resultType = SkillRule.getResultType( total );
		var point = SkillRule.getWinPoint( total );

		// 胜败：
		if ( resultType == FIGHT_RESULT_WIN ) {
			actorA.context.increaseWin();
			actorB.context.increaseLost();
			actorA.strategy.levelUp( actorA.skillGroup.skills, point );
			// 扣血
			if ( this.gameMode.isCanBeDeath() ) {
				actorB.changeLife( hurt );
			}

		} else if ( resultType == FIGHT_RESULT_LOST ) {
			actorA.context.increaseLost();
			actorB.context.increaseWin();
			actorB.strategy.levelUp( actorB.skillGroup.skills, point );
			// 扣血
			if ( this.gameMode.isCanBeDeath() ) {
				actorA.changeLife( hurt );
			}

		} else {
			actorA.context.increaseFair();
			actorB.context.increaseFair();
		}

		// 历史记录
		actorA.context.history.addEnemy( actorB, skillsB );
		actorB.context.history.addEnemy( actorA, skillsA );

		this._changeRank( actorA, actorB, resultType );

		if ( this.fightResultCallback ) {
			this.fightResultCallback( actorA, actorB, resultType, total, logs );
		}

		// 检测死亡
		if ( this.gameMode.isCanBeDeath() ) {
			if ( actorA.isDeath() ) {
				this._die( actorA );

			} else if ( actorB.isDeath() ) {
				this._die( actorB );
			}
		}

	},

	_die : function( actor ) {
		this.deathCount ++;

		if ( this.deathCallback ) {
			this.deathCallback( actor );
		}

		var from = actor.context.getRank();
		var lastDeathRank = this.maxActors - this.deathCount + 1;

		// 移动到最后
		this._moveBackword( from, lastDeathRank );
	},

	_changeRank : function( actorA, actorB, resultType ) {
		if ( resultType == FIGHT_RESULT_FAIR || resultType == FIGHT_RESULT_LOST) {
			return;
		}

		var winner, loser;
		if ( resultType == FIGHT_RESULT_WIN ) {
			winner = actorA;
			loser = actorB;

		} else {
			winner = actorB;
			loser = actorA;
		}


		var from = loser.context.getRank();
		var to = winner.context.getRank();

		this._moveForword( from, to );
	},

	// 向前移动
	_moveForword : function( from, to ) {
		// 两两交换中间的排名
		for ( var i = to; i >= from + 1; i -- ) {
			if ( i === 1 ) break;
			this._swapRank( this.rankMap[ i ], this.rankMap[ i - 1 ]  );
		}
	},

	// 向后移动
	_moveBackword : function( from, to ) {
		for ( var i = from; i <= to -1; i ++ ) {
			if ( i === this.maxActors ) break;
			this._swapRank( this.rankMap[ i ], this.rankMap[ i + 1 ]  );
		}
	},

	_swapRank : function( actorA, actorB ) {

		var rankA = actorA.context.getRank();
		var rankB = actorB.context.getRank();

		if ( this.swapRankCallback ) {
			this.swapRankCallback( actorA, actorB, rankB, rankA );
		}

		actorA.context.setRank( rankB );
		actorB.context.setRank( rankA );

		this.rankMap[ rankA ] = actorB;
		this.rankMap[ rankB ] = actorA;
	},

	_createActors : function() {
		var _this = this;

		var names = ACTOR_NAMES.slice( 0, this.maxActors - !!this.useManual );
		if ( this.useManual ) {
			names.push( ACTOR_NAME_PLAYER );
		}
		names.shuffle();

		var strategyClasses = [];

		// 特殊策略
		strategyClasses.addArray( 
			Arrays.create( 10, function( i ) { return FocuseStrategy; })

		).addArray( 
			Arrays.create( 10, function( i ) { return ExcellentStrategy; })

		).addArray( 
			Arrays.create( 10, function( i ) { return ChallengerStrategy; })

		).addArray( 
			Arrays.create( 15, function( i ) { return SmartStrategy; })
		);


		// 其余用随机策略补充
		var leftCount = this.maxActors - strategyClasses.length;
		if ( leftCount > 0 ) {
			classNames = Arrays.create( leftCount, function( i ) {
					return RandomStrategy;
			});
			strategyClasses.addArray( classNames );
		}

		strategyClasses.shuffle();


		var actors = names.mapNew( function( name, i ) {
			 var rank = i + 1;
			var skillGroup = new SkillGroup();

			var context = new Context();
			context.setRank ( rank );

			var actor = new Actor( name, skillGroup, context );
			actor.setId( i );

			if ( actor.getName() == ACTOR_NAME_PLAYER ) {
				actor.isManual = true;
				actor.setStrategy( new ManualStrategy() );
				_this.manualActor = actor;

			} else {
				var strategyClass = strategyClasses.length > 0 ? 
								strategyClasses.shift() : RandomStrategy;

				actor.isManual = false;
				actor.setStrategy( new strategyClass() );
			}

			_this.rankMap[ rank ] = actor;

			return actor;
		});

		return actors;
	},

	_getFrontActors : function( actor ) {
		var rank = actor.context.getRank();
		if ( rank <= 1 ) {
			return null;
		}
		var from = ( rank - 10 ).fixedIn( 0, this.maxActors );
		var to = rank - 1;
		return this.rankMap.getByKeys( Arrays.range( from, to ) );
	}

});




/**
 * 游戏模式的基类
 */
var GameModeBase = Class({

	init : function() {
		this.name = '';
	},

	getName : function() {
		return this.name;
	},

	// 游戏是否结束了
	isGameOver : function( game ) {
		return false;
	},

	// 是否允许卡牌死亡
	isCanBeDeath : function() {
		return false;
	},

	// 是否最后一回合
	_isLastStep : function ( game ) {
		if (  game.step >= game.maxStep && game.turns >= game.maxTruns ) {
			return true;
		}
		return false;
	}

});

/**
 * 个人挑战模式
 */
var PersonalWarGameMode = Class( GameModeBase, {

	init : function() {
		this.name = '个人挑战模式';
	},

	// 游戏是否结束了
	isGameOver : function( game ) {
		return this._isLastStep( game );
	},

	// 是否允许卡牌死亡
	isCanBeDeath : function() {
		return false;
	}

});

/**
 * 个人淘汰模式
 */
var PersonalDieOutGameMode = Class( GameModeBase, {

	init : function() {
		this.name = '个人淘汰模式';
	},

	// 游戏是否结束了
	isGameOver : function( game ) {
		// 剩下一个人的时候结束
		if ( game.actors.length - game.deathCount <= 1 ) {
			return true;
		}

		return this._isLastStep( game );
	},

	// 是否允许卡牌死亡
	isCanBeDeath : function() {
		return true;
	}

});
