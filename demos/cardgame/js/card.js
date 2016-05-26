if ( ! global ) {
	global = this;
}

global.BaseCards = [];

global.Card = Class( {
	name : '',

	effectTime : 1,

	init : function() {
	},

	before : function() {
	},

	run : function() {
	},

	after : function() {
	}
});


global.AttackCard = Class( Card, {
	name : 'Attack',

	init : function() {
	}

});
BaseCards.push( AttackCard );

global.DefenseCard = Class( Card, {
	name : 'Defense',

	init : function() {
	}

});
BaseCards.push( DefenseCard );

global.MoveCard = Class( Card, {
	name : 'Move',

	init : function() {
	}

});
BaseCards.push( MoveCard );

global.EnegineCard = Class( Card, {
	name : 'Enegine',

	init : function() {
	}

});
BaseCards.push( EnegineCard );

