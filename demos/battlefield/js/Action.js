var ACTION_LEVEL_VERY_LOW = 100;
var ACTION_LEVEL_LOW = 300;
var ACTION_LEVEL_NORMAL = 500;
var ACTION_LEVEL_HIGH = 700;
var ACTION_LEVEL_VERY_HIGH = 900;

/**
 * AI执行动作
 */
var Action = function( name, desire, execute ) {
	this.name = name;
	this.desire = desire || ACTION_LEVEL_NORMAL;
	this.execute = execute; // function
	this.performing = false;

	this.startTime = 0;
	this.endTime = 0;

};

Action.prototype = {

	perform : function() {
		if ( ! this.execute ) {
			return;
		}
		this.performing = true;
		this.startTime = +new Date();
		Crafty.trigger( 'ActionStart', this );
		return this.execute();
	},

	finish : function() {
		this.performing = false;
		this.endTime = +new Date();
		Crafty.trigger( 'ActionEnd', this );
	},

	cancel : function() {
		this.performing = false;
		this.endTime = +new Date();
	},

	destroy : function() {
		this.cancel();
		this.execute = null;
	},

	getCostTime : function() {
		return ( ( this.endTime || +new Date() ) - this.startTime ) / 1000;
	}

};
