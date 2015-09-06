var Context = Class({
	init : function() {
		this.rank = 0;
		this.win = 0;
		this.lost = 0;
		this.fair = 0;
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
		this.context =  new Context();
		this.id = id;
		this.name = name;
		this.description = '';
		this.step = 0;

		this.changeValueCallback = null;
		this.deathCallback = null;

		this.style = { bgColor : '', fontColor : '' };
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
	chooseEnemy : function( actors ) {
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

	increaseStep : function() {
		this.step += 1;
	}
});


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
	}
};

var Fight = {

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

/*
 * 随机策略
 */
var RandomStrategy = Class( StrategyBase, {

	init : function( id ) {
		this._init( id, '随机策略' );
		this.description = '任何选择都是随机的';
	},

	chooseEnemy : function( actors ) {
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
	chooseEnemy : function( actors ) {
		return ChooseEnemy.random( actors );
	},

	fight : function( skillGroup, count ) {
		return Fight.maxValueSkills( skillGroup.skills, count );
	},

	attacked : function( enemy, skillGroup, count ) {
		return Fight.randomOrMaxValue( skillGroup, count );
	},

	// 升级，随机分配技能点
	levelUp : function( skills, points ) {
		Fight.maxValueSkills( skills, points ).map( function( skill, i ) {
			skill.addValue( 1 );
		});
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

	chooseEnemy : function( actors ) {
		return ChooseEnemy.randomOrGiveup( actors );
	},

	fight : function( skillGroup, count ) {
		return Fight.randomOrMaxValue( skillGroup, count );
	},

	attacked : function( enemy, skillGroup, count ) {
		return Fight.randomOrMaxValue( skillGroup, count );
	},

	// 随机在前三项最好的技能中升级
	levelUp : function( skills, points ) {
		Fight.maxValueSkills( skills, 3 ).shuffle().slice( 0, points ).map( function( skill, i ) {
			skill.addValue( 1 );
		});
	}

});



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

	chooseEnemy : function( actors ) {
		var names = actors.mapNew( function( actor, i ) {
			return actor.getName() + '(' + i + ')';
		}).join( ', ' );

		var text = '是否发起挑战？当前可以选择的对象有：\n' + names + '\n请输入对应的数字编号';
		var command = this._getInput( text );
		if ( command === null ) {
			return;
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
		var preText = '$0(第$1位)向你发起了挑战！\n'.format( enemy.getName(), enemy.context.getRank() );
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

	_selectSkills : function( skills, count, preText, content, checkCallback ) {

		var skillNames = skills.mapNew( function( skill, i ) {
			return '【' + i + '】' + skill.name +  skill.getValue() ;
		}).join( '    ' );

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


