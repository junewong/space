var History = Class( {
	init : function() {
		// 交战过的对手
		this.enemies = [];
		// 交战过的对手用过的技能
		this.enemySkills = {};
	},

	addEnemy : function( actor, skills ) {
		this.enemies.push( actor.getId() );
		if ( skills ) {
			this.addEnemySkills( actor, skills );
		}
	},

	addEnemySkills : function( actor, skills ) {
		var id = actor.getId();
		var list = this.enemySkills[ id ];
		if ( list === undefined ) {
			list = [];
			this.enemySkills[ id ] = list;
		}

		skills.map ( function( skill, i ) {
			list.addUniq( skill.getIndex() ).sort();
		});
	},

	getSkills : function( actor ) {
		return this.enemySkills[ actor.getId() ];
	}

});

var Context = Class({
	init : function() {
		this.rank = 0;
		this.win = 0;
		this.lost = 0;
		this.fair = 0;
		this.history = new History();
	},

	getWin : function() {
		return this.win;
	},

	getLost : function() {
		return this.lost;
	},

	getFair : function() {
		return this.fair;
	},

	increaseWin : function() {
		this.win += 1;
	},

	increaseLost : function() {
		this.lost += 1;
	},

	increaseFair : function() {
		this.fair += 1;
	},

	setRank : function( rank ) {
		this.rank = rank;
	},

	getRank : function() {
		return this.rank;
	},

	getDescription : function() {
		return this.getWin() + '胜 ' + this.getLost() + '败 ' + this.getFair() + '平';
	}

});

/**
 * 策略的基类
 */
var StrategyBase = Class({
	init : function( id ) {
		this._init( id );
	},

	_init : function( id, name ) {
		this.context = null;
		this.id = id;
		this.name = name;
		this.description = '';
		this.step = 0;

		this.changeValueCallback = null;
		this.deathCallback = null;

		this.style = { bgColor : '', fontColor : '' };
	},

	setContext : function( context ) {
		this.context = context;
	},

	setId : function( id ) {
		this.id = id;
	},

	getId : function() {
		return this.id;
	},

	getName : function() {
		return this.name;
	},

	getUniqName : function() {
		return this.name + '(' + this.id + ')';
	},

	getValue : function() {
		return this.context.getValue();
	},

	changeValue : function( offset ) {
		this.context.appendValue( offset );

		if ( this.changeValueCallback ) {
			this.changeValueCallback( offset );
		}

		if ( this.getValue() <= 0 ) {
			if ( this.deathCallback ) {
				this.deathCallback( this.getValue() );
			}
			return;
		}
	},

	// be override
	chooseEnemy : function( actors, me ) {
	},

	// be override
	fight : function( other ) {
	},

	// be override
	attacked : function( other, skillGroup, count ) {
	},

	// be override
	levelUp : function( skills, points ) {
	},

	isDead : function() {
		return this.getValue() <= 0;
	},

	// can be override
	isGhostKiller : function() {
		return false;
	},

	increaseStep : function() {
		this.step += 1;
	}
});


// ==== 原子操作 ====

var ChooseEnemy  = {

	// 随机选择，一定的几率会放弃
	randomOrGiveup : function( actors ) {
		if ( ! actors ) {
			return null;
		}

		// 二十分之一会走下面的对手
		// 否则的话就一定要选择
		if ( Random.getInt( 20 ) > 0 ) {
			return this.random( actors );
		}

		var i = Random.getInt( actors.length );
		// 不做挑战
		if ( i == actors.length ) {
			return null;
		}
		// 随机选择敌人
		return actors[ i ];
	},

	// 随机选择，但不会放弃挑战 
	random : function( actors ) {
		if ( ! actors ) {
			return null;
		}
		var i = Random.getInt( actors.length -1 );
		// 随机选择敌人
		return actors[ i ];
	},

	// 在挑战列表的前几名中随机挑选一个挑战
	topOne : function( actors, count ) {
		if ( ! actors ) {
			return null;
		}
		var topActors = actors.length < count ? actors : actors.slice( 0, count  );
		return Random.one( topActors );
	},

	// 有分析过程的选择，查找排名最前且胜率比自己低的对手挑战，否则随机
	smartChoice : function( actors, me ) {
		var win = me.context.getWin();
		if ( win === 0 ) {
			return this.random( actors );
		}
		var choice = actors.findFirst( function( actor, i ) {
			return actor.context.getWin() < win;
		});

		return choice || this.random( actors );
	}
};

var Fight = {

	// 使用最强的技能
	maxValueSkills : function( allSkills, count ) {
		var skills = Arrays.copy( allSkills );
		skills.sort( function( a, b ) {
			return a.getValue() < b.getValue();
		});
		return skills.slice( 0, count ).shuffle();
	},

	// 十分之一的几率用随机，其他用最大值
	randomOrMaxValue : function( skillGroup, count ) {
		return Random.getInt( 9 ) === 0 ?
					skillGroup.getRandomSkills( count ) :
					this.maxValueSkills( skillGroup.skills, count );
	}
};

var Levelup = {

	// 给数组中的技能加点数
	addPoints : function( skills ) {
		( skills instanceof Array ? skills : [ skills ] ) .map( function( skill, i ) {
			skill.addValue( 1 );
		});
	},

	// 把点数加在最强几个技能上
	addToMaxSkills : function( skills, points ) {
		this.addPoints( Fight.maxValueSkills( skills, points ) );
	},

	// 随机在前三项最好的技能中升级
	randomFor3MaxSkills : function( skills, points ) {
		this.addPoints( Fight.maxValueSkills( skills, 3 ).shuffle().slice( 0, points ) );
	},

	// 带分析的选择
	smartChoice : function( skills, points ) {
		var maxSkills = Fight.maxValueSkills( skills, 3 );

		// 如果有3个点数，则平均加
		if ( points === 3 ) {
			this.addPoints( maxSkills );
			return;
		}

		var base = 20;

		// 三个都大于20,则随机在三个中分配
		if ( skills.allMatch( function( skill ) { return skill.getValue() >= base; } ) ) {
			this.randomFor3MaxSkills( skills, points );
			return;
		}

		// 如果最大的技能超过20
		if ( maxSkills[0].getValue() >= base ) {
			// 如果第二个技能还不到20，加给第二和第三技能
			if ( maxSkills[1].getValue() < base ) {
				this.addPoints( maxSkills.slice( 1, points ) );
				return;

			} else {
				// 只有第三技能没到20，则全部加到第三技能去
				this.addPoints( Arrays.copyToArray( maxSkills[2], points ) );
				return;
			}

		// 如果都不到20，则加最强和第三的前几个技能
		} else {
			this.addToMaxSkills( skills, points );
			return;
		}

		this.addToMaxSkills( skills, points );
	}
};

// ==== 各种策略 ====

/*
 * 随机策略
 */
var RandomStrategy = Class( StrategyBase, {

	init : function( id ) {
		this._init( id, '随机策略' );
		this.description = '任何选择都是随机的';
	},

	chooseEnemy : function( actors, me ) {
		return ChooseEnemy.randomOrGiveup( actors );
	},

	// 如果对方上一次是合作，则合作，否则报复；默认是合作；
	fight : function( skillGroup, count ) {
		return skillGroup.getRandomSkills( count );
	},

	// 根据对方上一次做相同反应，否则选择合作
	attacked : function( enemy, skillGroup, count ) {
		return Random.some( skillGroup.skills, count );
	},

	// 升级，随机分配技能点
	levelUp : function( skills, points ) {
		Arrays.repeat( points, function( i ) {
			var skill = Random.one( skills );
			skill.addValue( 1 );
		});
	},

	// 死亡的时候
	death : function( game ) {
	}

});




/*
 * 专心致志策略
 */
var FocuseStrategy = Class( StrategyBase, {

	init : function( id ) {
		this._init( id, '专心致志' );
		this.description = '专注提升自己的两种最强强项';
	},

	// 随机选择，但不会放弃挑战 
	chooseEnemy : function( actors, me ) {
		return ChooseEnemy.random( actors );
	},

	fight : function( skillGroup, count ) {
		return Fight.maxValueSkills( skillGroup.skills, count );
	},

	attacked : function( enemy, skillGroup, count ) {
		return Fight.randomOrMaxValue( skillGroup, count );
	},

	levelUp : function( skills, points ) {
		Levelup.addToMaxSkills( skills, points );
	}

});

/**
 * 精英专修策略
 */
var ExcellentStrategy = Class( StrategyBase, {

	init : function( id ) {
		this._init( id, '精英专修' );
		this.description = '专修最擅长的前三项';
	},

	chooseEnemy : function( actors, me ) {
		return ChooseEnemy.randomOrGiveup( actors );
	},

	fight : function( skillGroup, count ) {
		return Fight.randomOrMaxValue( skillGroup, count );
	},

	attacked : function( enemy, skillGroup, count ) {
		return Fight.randomOrMaxValue( skillGroup, count );
	},

	levelUp : function( skills, points ) {
		Levelup.randomFor3MaxSkills( skills, points );
	}

});

/**
 * 狂热挑战策略
 */
var ChallengerStrategy = Class( StrategyBase, {

	init : function( id ) {
		this._init( id, '狂热挑战' );
		this.description = '每次从前三名中随机挑选一名挑战。';
	},

	chooseEnemy : function( actors, me ) {
		return ChooseEnemy.topOne( actors, 3 );
	},

	fight : function( skillGroup, count ) {
		return Fight.randomOrMaxValue( skillGroup, count );
	},

	attacked : function( enemy, skillGroup, count ) {
		return Fight.randomOrMaxValue( skillGroup, count );
	},

	levelUp : function( skills, points ) {
		Levelup.addToMaxSkills( skills, points );
	}

});

/**
 * 谋定后动挑战策略
 */
var SmartStrategy = Class( StrategyBase, {

	init : function( id ) {
		this._init( id, '谋定后动' );
		this.description = '找胜率比自己低的对手挑战；根据当前的情况分配点数；';
	},

	chooseEnemy : function( actors, me ) {
		return ChooseEnemy.smartChoice( actors, me );
	},

	fight : function( skillGroup, count ) {
		return Fight.randomOrMaxValue( skillGroup, count );
	},

	attacked : function( enemy, skillGroup, count ) {
		return Fight.randomOrMaxValue( skillGroup, count );
	},

	levelUp : function( skills, points ) {
		Levelup.smartChoice( skills, points );
	}

});


/**
 * 谋定后动挑战策略
 */
var GhostKillerStrategy = Class( StrategyBase, {

	init : function( id ) {
		this._init( id, '幽灵杀手' );
		this.description = '可攻击范围内出现玩家一定挑战；如果死亡，则会俯身到其他卡牌上，并且有属性加成；';
	},

	chooseEnemy : function( actors, me ) {
		if ( ! actors  ) {
			return null;
		}
		var manualActor = actors.findFirst( function( actor, i ) {
			return actor.isManual;
		});
		if ( manualActor ) {
			return manualActor;
		}
		return ChooseEnemy.smartChoice( actors, me );
	},

	fight : function( skillGroup, count ) {
		return Fight.randomOrMaxValue( skillGroup, count );
	},

	attacked : function( enemy, skillGroup, count ) {
		return Fight.randomOrMaxValue( skillGroup, count );
	},

	levelUp : function( skills, points ) {
		Levelup.smartChoice( skills, points );
	},

	// can be override
	isGhostKiller : function() {
		return true;
	},

});

// 在别人的基础上创建这个策略
GhostKillerStrategy.createBy = function( sourceActor ) {
	var strategy = new GhostKillerStrategy();
	for ( var k in sourceActor.strategy ) {
		if ( false ===  [ 'isGhostKiller', 'chooseEnemy', 'description' ].contains( k ) ) {
			strategy[ k ] = sourceActor.strategy[ k ];
		}
	}
	return strategy;
};


/**
 * 玩家策略 
 */
var ManualStrategy = Class( StrategyBase, {
	init : function( id ) {
		this._init( id, '玩家策略' );
		this.description = '玩家手动操作的策略';
		this.lastFightSkills = '';
		this.lastLevelupSkills = '';
	},

	chooseEnemy : function( actors, me ) {
		var names = actors.mapNew( function( actor, i ) {
			return '【' + i + '】' + actor.getName();
		}).join( '\n' );

		var _this = this;
		var callback = function( actor, i ) {
			return '【' + i + '】' + actor.getName() +  _this._getHistorySkills( actor ) + '  ' + actor.strategy.getName();
		};

		var command;
		var i = 10;
		while ( i-- > 0 ) {
			var text = '是否发起挑战？当前可以选择的对象有：\n' + names + '\n请输入对应的数字编号\n输入【i】则查看对方的信息';
			command = this._getInput( text );
			if ( command === null ) {
				return;
			}
			// 'i' 指令可查看用户资料
			if ( command === 'i' ) {
				var help = actors.mapNew( callback ).join( '\n' );
				alert( help );

			} else {
				break;

			}
		}

		var index = parseInt( command );
		return actors[ index ];
	},

	// 如果对方上一次是合作，则合作，否则报复；默认是合作；
	fight : function( skillGroup, count ) {
		return this._selectSkills( skillGroup.skills, count, '', this.lastFightSkills );
	},

	// 根据对方上一次做相同反应，否则选择合作
	attacked : function( enemy, skillGroup, count ) {
		var enemySkills = this._getHistorySkills( enemy );
		var preText = '$0(第$1位)向你发起了挑战！\n$2\n'.format( enemy.getName(), enemy.context.getRank(), enemySkills );
		return this._selectSkills( skillGroup.skills, count, preText, this.lastFightSkills );
	},

	// 升级，随机分配技能点
	levelUp : function( skills, points ) {
		var preText = '恭喜！你获得了$0个技能点，可以选择添加到哪些技能上。\n'.format( points );

		var selectedSkills =  this._selectSkills( skills, points, preText, this.lastLevelupSkills, function( command ) {
			var reg = new RegExp( "(\\d\\s*){" + points + "}" );
			return reg.test( command );
		});

		selectedSkills.map( function( skill, i ) {
			skill.addValue( 1 );
		});

		var results = selectedSkills.mapNew( function( skill, i ) {
			return skill.name + '(' + skill.getValue() + ')';
		}).join( ', ');

		alert( '升级后的技能如下：' + results );
	},

	_getHistorySkills : function( enemy ) {
		var historySkills = this.context.history.getSkills( enemy ) || [];

		return enemy.skillGroup.skills.mapNew( function( skill, i ) {
			var value = skill.getIndex() in historySkills ? skill.getValue() : '？';
			return skill.getName() + value;

		}).join( '   ' ).wrap( '（', '）' );

	},

	_selectSkills : function( skills, count, preText, content, checkCallback ) {

		var skillNames = skills.mapNew( function( skill, i ) {
			return '【' + i + '】' + skill.name +  skill.getValue() ;
		}).join( '\n' );

		var command = null;
		var k = 10;
		while( k -- > 0 ) {
			var text = (preText || '') + '请选择要使用的$0个技能。当前可以选择的对象有：\n$1。\n请输入$0个数字。'.format( count, skillNames );

			command = this._getInput( text, content );
			if ( command === null ) {
				continue;
			}

			var isOK;

			if ( checkCallback ) {
				isOK = checkCallback( command );

			} else {
				isOK = /(\d\s*){3}/.test( command );
			}

			if ( false === isOK) {
				alert( '输入指令错误，请重试！' );

			} else {
				break;
			}
		}

		// 记住上一次的输入内容
		// 这里有点不太好的地方是，用callback来识别输入的来源
		if ( checkCallback ) {
			this.lastLevelupSkills = command;

		} else {
			this.lastFightSkills = command;
		}

		var indexs = command.replace( /\s/, '' ).split( '' );

		return indexs.mapNew( function( index, i ) {
			return skills[ index ];
		});
	},

	_getInput : function( text, content ) {
		var command = prompt( text, ( content || '' ) );
		if ( command === '' || command === undefined ) {
			return null;
		}
		return command;
	}

});


