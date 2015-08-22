
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

		var liveCount = 0;
		for ( var i in offsets ) {
			var point = offsets[i];
			var offsetX = this.x + point[0], offsetY = this.y + point[1];

			var neiCell = this.fetchCell( offsetX, offsetY, Cell.getId( offsetX, offsetY )  );
			//console.log( this.getId() + " offset x:" + offsetX + " offset y:" + offsetY  + " cell:" +  neiCell );///

			if ( ! neiCell ) continue;
			liveCount +=  ( neiCell.isAlive() ? 1 : 0 );
		}

		if ( liveCount == this.aliveArea[1] ) {
			this.nextLife = CELL_ALIVE;

		} else if ( liveCount < this.aliveArea[0] || liveCount > this.aliveArea[1] ) {
			this.nextLife = CELL_DEATH;
		}  else {
			this.nextLife = this.life;
		}

		if ( liveCount > 0 ) {
			//console.log( this.getId() + " count:" + liveCount + " live:" + this.nextLife );///
		}

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


