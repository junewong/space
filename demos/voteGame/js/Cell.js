
var CELL_DEATH = 0;
var CELL_ALIVE = 1;

var Cell = function( x, y ) {
	this.x = x;
	this.y = y;
	this.life = CELL_DEATH;
	this.nextLife = this.life;
	this.changeCallback = null;
	this.fetchCellCallback = null;

	this.aliveArea = [2, 3];
};

Cell.getId = function(x, y) {
	return "cell_" + x + "_" + y;
};

Cell.prototype = {

	setLive : function( live ) {
		this.nextLife = live;
		this.change();
	},

	change : function() {
		var isChange = this.life !== this.nextLife;

		this.life = this.nextLife;

		if ( isChange ) {
			this.changeCallback && this.changeCallback( this.life );
		}
	},

	isAlive : function() {
		return this.life !== CELL_DEATH;
	},

	getId : function() {
		return Cell.getId( this.x, this.y );
	},

	checkAlive : function() {
		var offsets = [ 
			[-1, -1 ], [0, -1 ], [1, -1 ], 
			[-1, 0  ], 			 [1, 0  ], 
			[-1, 1  ], [0, 1  ], [1, 1  ], 
		];

		var i = parseInt( Math.random() * 10000 ) % offsets.length;

		var point = offsets[i];
		var offsetX = this.x + point[0], offsetY = this.y + point[1];

		var neiCell = this.fetchCell( offsetX, offsetY, Cell.getId( offsetX, offsetY )  );
		//console.log( this.getId() + " offset x:" + offsetX + " offset y:" + offsetY  + " cell:" +  neiCell );///

		// copy value
		this.nextLife = this.neiCell.life;
	},

	fetchCell : function( x, y, id  ) {
		if ( ! this.fetchCellCallback ) return null;
		return this.fetchCellCallback( x, y, id );
	},

	onFetchCell : function( callback ) {
		this.fetchCellCallback = callback;
	},

	onChange : function( callback ) {
		this.changeCallback = callback;
	}

};


