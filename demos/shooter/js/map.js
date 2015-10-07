var Map = function( tileSize, width, height) {
	this.tileSize = tileSize;
	this.width = width;
	this.height = height;
	this.w = 0;
	this.h = 0;

	this.tiles = [];

	this.init();
};

Map.prototype = {
	init : function() {
		var w = this.w = Math.ceil( this.width / this.tileSize );
		var h = this.h = Math.ceil( this.height / this.tileSize );

		var rows = [];
		for ( var x = 0; x < w; x++ ) {
			var cloumns = [];
			for( var y = 0; y < h; y++ ) {
				cloumns.push( 0 );
			}
			rows.push( cloumns );
		}
		this.tiles = rows;
	},

	addBlock : function( x, y, w, h ) {
		this.setValue( x, y, w, h, 1 );
	},

	addEntity : function( e ) {
		this.addBlock( e.x, e.y, e.w, e.h );
	},

	removeBlock : function( x, y, w, h ) {
		this.setValue( x, y, w, h, 0 );
	},

	setValue : function( x, y, w, h, value ) {
		x = Math.floor( x / this.tileSize );
		y = Math.floor( y / this.tileSize );
		w = Math.floor( w / this.tileSize );
		h = Math.floor( h / this.tileSize );
		for ( var xLen = x + w; x < xLen; x ++ ) {
			for ( var yLen = y + h; y < yLen; y ++ ) {
				if ( x < this.tiles.length && y < this.tiles[x].length ) {
					this.tiles[x][y] = value;
				}
			}
		}
	},

	checkBlock : function( x, y, w, h ) {
		x = Math.floor( x / this.tileSize );
		y = Math.floor( y / this.tileSize );
		w = Math.floor( w / this.tileSize );
		h = Math.floor( h / this.tileSize );
		for ( var xLen = x + w; x < xLen; x ++ ) {
			for ( var yLen = y + h; y < yLen; y ++ ) {
				if ( ! ( x < this.tiles.length && y < this.tiles[x].length ) ) {
					continue;
				}
				var v = this.tiles[x][y];
				if ( v === 1 ) {
					return true;
				}
			}
		}
		return false;
	}
};
