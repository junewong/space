/**
 * @import base.js dict.js skill.js strategy.js actor.js
 */
var RankWarGame = Class({

	init : function( maxActors ) {
		this.turns = 0;
		this.step = 1;
		this.maxActors = maxActors || 100;
		this.maxTruns = 20;

		this._isPlaying = false;
		this.handle = null;

		this.nextTurnsCallback = null;
		this.nextStepCallback = null;
		this.endCallback = null;
		this.fightCallback = null;
		this.fightResultCallback = null;
		this.swapRankCallback = null;
		this.giveUpCallback = null;

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

	next : function() {

		// 新的一回合
		if ( this.step <= 1 ) {
			this.turns ++;
			// 打乱顺序
			this.actors.shuffle();
			if ( this.nextTurnsCallback ) {
				this.nextTurnsCallback( this.turns, this.step );
			}
		}

		// 每个人轮流发起挑战
		var actor = this.actors[ this.step -1 ];
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
			if ( this.turns >= this.maxTruns ) {
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

		function autoRun() {
			// 获取每次的动画帧
			setTimeout( function() {
				if ( _this._isPlaying ) {
					_this.handle = requestAnimationFrame( autoRun );
					_this.next();
				}
			}, 100 );
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
		var total = 0;
		Arrays.mapBoth( skillsA, skillsB, function( a, b, i ) {
			var score = SkillRule.fight( a, b );
			total += SkillRule.getRealScore( score );
			logs.push( SkillRule.getLastFightLog() );
		});

		var resultType = SkillRule.getResultType( total );
		var point = SkillRule.getWinPoint( total );

		// 胜败：
		if ( resultType == FIGHT_RESULT_WIN ) {
			actorA.context.increaseWin();
			actorB.context.increaseLost();
			actorA.strategy.levelUp( actorA.skillGroup.skills, point );

		} else if ( resultType == FIGHT_RESULT_LOST ) {
			actorA.context.increaseLost();
			actorB.context.increaseWin();
			actorB.strategy.levelUp( actorB.skillGroup.skills, point );

		} else {
			actorA.context.increaseFair();
			actorB.context.increaseFair();
		}

		this._changeRank( actorA, actorB, resultType );

		if ( this.fightResultCallback ) {
			this.fightResultCallback( actorA, actorB, resultType, total, logs );
		}

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

		// 两两交换中间的排名
		for ( var i = to; i >= from + 1; i -- ) {
			if ( i === 1 ) break;
			this._swapRank( this.rankMap[ i ], this.rankMap[ i - 1 ]  );
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

		var names = ACTOR_NAMES.slice( 0, this.maxActors - 1 );
		names.push( ACTOR_NAME_PLAYER );
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

