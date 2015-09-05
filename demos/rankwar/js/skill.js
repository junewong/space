// === 技能关系： ===
// 正常
var SKILL_RULE_NORMAL = 1;
// 相克
var SKILL_RULE_RESTRICT = 2;
var SKILL_RULE_BE_RESTRICT = 3;
// 相生
var SKILL_RULE_CREATE = 4;
var SKILL_RULE_BE_CREATE = 5;

// === 战斗结果 ===
var FIGHT_RESULT_WIN = 1;
var FIGHT_RESULT_LOST = -1;
var FIGHT_RESULT_FAIR = 0;

var FIGHT_RESULT_MAP = {};
FIGHT_RESULT_MAP[ FIGHT_RESULT_WIN ] = '胜出'; 
FIGHT_RESULT_MAP[ FIGHT_RESULT_LOST ] = '败北'; 
FIGHT_RESULT_MAP[ FIGHT_RESULT_FAIR ] = '平手'; 

var Skill = Class({
	init : function( name, value, restrict, create ) {
		this.name = name;
		this.initValue = value;
		this.value = value;
		this.restrict = restrict;
		this.create = create;
	},

	getValue : function() {
		return this.value;
	},

	addValue : function( offset ) {
		this.value += offset;
	},

	setInitValue : function( value ) {
		this.initValue = value;
		this.value = value;
	},

	// 相克
	getRestrict : function() {
		return this.restrict;
	},

	// 相生
	getCreate : function() {
		return this.create;
	}
});

var SkillGroup = Class({
	init : function( defauleValue ) {

		this.gold   = new Skill( '金', defauleValue,  '木', '水' );
		this.wood   = new Skill( '木', defauleValue,  '土', '火' );
		this.warter = new Skill( '水', defauleValue,  '火', '木' );
		this.fire   = new Skill( '火', defauleValue,  '金', '土' );
		this.earth  = new Skill( '土', defauleValue,  '水', '金' );

		this.skills = [ this.gold, this.wood, this.warter, this.fire, this.earth ];

		if ( ! defauleValue  ) {
			this._setRandomValue( 25 );
		}
	},

	// 将25点值随机分配到5个技能中
	_setRandomValue : function( total ) {
		var _this = this;

		var rand = Random.splitNumber( total, this.skills.length );
		rand.map( function( value, i ) {
			_this.skills[i].setInitValue( value );
		});
	},

	// 获取随机的几个技能
	getRandomSkills : function( count ) {
		var _this = this;
		var indexs = Random.uniqueNumber( this.skills.length );
		return indexs.slice( 0, count ).mapNew( function( index, i ) {
			return _this.skills[ index ];
		});
	}
});


var SkillRule = {

	check : function( skillA, skillB ) {
		if ( skillB.name === skillA.getRestrict() ) {
			return SKILL_RULE_RESTRICT;
		}
		if ( skillA.name === skillB.getRestrict() ) {
			return SKILL_RULE_BE_RESTRICT;
		}
		if ( skillA.name === skillB.getCreate() ) {
			return SKILL_RULE_BE_CREATE;
		}
		if ( skillB.name === skillA.getCreate() ) {
			return SKILL_RULE_CREATE;
		}
		return SKILL_RULE_NORMAL;
	},

	getRealValue : function( skillA, skillB ) {
		var valueA = skillA.getValue();
		var valueB = skillB.getValue();

		var relation = this.check( skillA, skillB );
		// 相克，攻击力减半
		if ( relation == SKILL_RULE_RESTRICT ) {
			valueB = Math.ceil( valueB /2 );

		} else if ( relation == SKILL_RULE_BE_RESTRICT ) {
			valueA = Math.ceil( valueA /2 );

		// 相生，攻击力翻倍
		} else if ( relation == SKILL_RULE_CREATE ) {
			valueB *= 2;

		} else if ( relation == SKILL_RULE_BE_CREATE ) {
			valueA *= 2;
		}
		return [ valueA, valueB ];
	},

	fight : function( skillA, skillB ) {
		var realValue = this.getRealValue( skillA, skillB );
		return realValue[0] - realValue[1];
	},

	fights : function( skillsA, skillsB ) {
		var total = 0 ;
		Arrays.mapBoth( skillsA, skillsB, function( a, b, i ) {
			var score = SkillRule.fight( a, b );
			total += score;
		});
		return total;
	},

	// 胜利者该拿多少点奖励 
	getWinPoint : function( score ) {
		return Math.abs( score ) > 0 ? 2 : 0;
	},

	// 按兵不动该拿多少点奖励
	getStayPoint : function() {
		return 1;
	},

	// 战斗结果类型
	getResultType : function( score ) {
		if ( score === 0 ) {
			return FIGHT_RESULT_FAIR;
		}
		return score > 0 ? FIGHT_RESULT_WIN : FIGHT_RESULT_LOST;
	},

	// 获取真实分数，胜利1分，失败-1，平手0
	getRealScore : function( score ) {
		return this.getResultType( score );
	}

};
