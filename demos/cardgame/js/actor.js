if ( ! global ) {
	global = this;
}

ps = global.ps;

global.Actor = Class({

	name : '',

	init : function() {
		this.maxLife = 30;
		this.initLife = 15;
		this.life = this.initLife;

		this.id = null;
		//this.name = "";
		this.weapon = null;

	},

	run : function() {
		var message = "{0} is playing ... ".format( this.name );
		printer( message, function() {
			ps.done();
		});
	}

});

global.AIPlayer = Class( Actor, {
	name : 'AI',
});

global.Player = Class( Actor, {
	name : 'Player'
});


