var ALL_STRAGEGY = [];

var Context = Class({
	init : function() {
		this.value = 10;
		this.actions = {};
		this.otherActions = {};
	},

	getValue : function() {
		return this.value;
	},

	appendValue : function( offset ) {
		this.value += offset;
	},

	getLastAction : function() {
		var history = this.actions[ id ];
		var length = history && history.length || 0;
		return length > 0 ? history[ length - 1 ] : null;
	},

	addAction: function( id, action ) {
		var otherPerson = this.actions[ id ];
		if ( ! otherPerson ) {
			otherPerson = [];
			this.actions[ id ] = otherPerson;
		}
		otherPerson.push( action ); 
	},

	addOtherAction : function( id, action ) {
		var otherPerson = this.otherActions[ id ];
		if ( ! otherPerson ) {
			otherPerson = [];
			this.otherActions[ id ] = otherPerson;
		}
		otherPerson.push( action ); 
	}, 

	getOtherLastAction : function( id ) {
		var history = this.otherActions[ id ];
		var length = history && history.length || 0;
		return length > 0 ? history[ length - 1 ] : null;
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

	deal : function( other ) {
	},

	answer : function( other, action ) {
	},

	isDead : function() {
		return this.getValue() <= 0;
	},

	increaseStep : function() {
		this.step += 1;
	}
});

/*
 * 以牙还牙策略
 */
var TitForTatStrategy = Class( StrategyBase, {

	init : function( id ) {
		this._init( id, '以牙还牙' );
		this.description = '根据跟对方上一个回合的交易情况，如果上次是欺诈，则报复，否则则合作。';
	},

	// 如果对方上一次是合作，则合作，否则报复；默认是合作；
	deal : function( other ) {
		var lastOtherAction = this.context.getOtherLastAction( other.id );
		if ( lastOtherAction === ACTION_CHEAT) {
			return ACTION_NONE;
		}
		return ACTION_COOPERATE;
	},

	// 根据对方上一次做相同反应，否则选择合作
	answer : function( other ) {
		var lastOtherAction = this.context.getOtherLastAction( other.id );
		if ( lastOtherAction === null) {
			return ACTION_COOPERATE;
		}
		return lastOtherAction;
	}

});
ALL_STRAGEGY.push( TitForTatStrategy );


/**
 * 每次都是找人合作，但是遇到别人找他合作的时候就使用欺诈。
 */
var CheatStrategy = Class( StrategyBase, {

	init : function( id ) {
		this._init( id, '欺诈师' );
		this.description = '主动时则总是选择发起合作，但如果别人找他合作，则使用欺诈。';
	},

	// 如果对方上一次是合作，则合作，否则报复；默认是合作；
	deal : function( other ) {
		return ACTION_COOPERATE;
	},

	// 根据对方上一次做相同反应，否则选择合作
	answer : function( other ) {
		return ACTION_CHEAT;
	}

});
ALL_STRAGEGY.push( CheatStrategy );


var CooperateStrategy = Class( StrategyBase, {

	init : function( id ) {
		this._init( id, '遵纪守法' );
		this.description = '如果对方上次有欺诈过，则不主动合作；但任何发起合作的时候都答应跟对方合作';
	},


	// 如果对方上一次是合作，则合作，否则报复；默认是合作；
	deal : function( other ) {
		var lastOtherAction = this.context.getOtherLastAction( other.id );
		if ( lastOtherAction === ACTION_CHEAT) {
			return ACTION_NONE;
		}
		return ACTION_COOPERATE;
	},

	// 根据对方上一次做相同反应，否则选择合作
	answer : function( other ) {
		return ACTION_COOPERATE;
	}

});
ALL_STRAGEGY.push( CooperateStrategy );


var DestroyStrategy = Class( StrategyBase, {

	init : function( id ) {
		this._init( id, '毁灭人格' );
		this.description = '从不主动跟对方合作，遇到有人发起合作，则选择欺诈。';
	},

	// 不主动跟人合作
	deal : function( other ) {
		return ACTION_NONE;
	},

	// 根据对方上一次做相同反应，否则选择合作
	answer : function( other ) {
		return ACTION_CHEAT;
	}

});
ALL_STRAGEGY.push( DestroyStrategy );

var RandomStrategy = Class( StrategyBase, {

	init : function( id ) {
		this._init( id, '随心所欲' );
		this.description = '无论是合作还是欺诈，都是随机的选择。';
	},

	// 随机选择合作还是放弃
	deal : function( other ) {
		return parseInt( Math.random() * 100 ) % 2 == 0 ? ACTION_COOPERATE : ACTION_NONE;
	},

	// 随机选择合作还是欺诈
	answer : function( other ) {
		return parseInt( Math.random() * 100 ) % 2 == 0 ? ACTION_COOPERATE : ACTION_CHEAT;
	}

});
ALL_STRAGEGY.push( RandomStrategy );

var RanCheatStrategy = Class( StrategyBase, {

	init : function( id ) {
		this._init( id, '心怀恶意' );
		this.description = '每次都选择合作，但是当别人跟他合作的时候，有一半几率会选择欺诈';
	},

	// 主动跟人合作
	deal : function( other ) {
		return ACTION_COOPERATE;
	},

	// 随机选择合作还是欺诈
	answer : function( other ) {
		return parseInt( Math.random() * 100 ) % 2 == 0 ? ACTION_COOPERATE : ACTION_CHEAT;
	}

});
ALL_STRAGEGY.push( RanCheatStrategy );
