
var GroupInfoMap = {};

var GroupInfo = Class({
	init : function() {
		this.money = 100;
	},

	addMoney : function( cost ) {
		this.money += cost;
	},

	reduceMoney : function( cost ) {
		this.money -= cost;
		if ( this.money < 0 ) {
			this.money = 0;
		}
	}

});
