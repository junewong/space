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

	setValue : function( x0, y0, w0, h0, value ) {
		var x = Math.floor( x0 / this.tileSize );
		var y = Math.floor( y0 / this.tileSize );
		var w = Math.floor( w0 / this.tileSize );
		var h = Math.floor( h0 / this.tileSize );
		for ( var i = x,  xLen = x + w; i < xLen; i ++ ) {
			for ( var j = y, yLen = y + h; j < yLen; j ++ ) {
				if ( i < this.tiles.length && j < this.tiles[i].length ) {
					this.tiles[i][j] = value;
					//console.log( 'set tiles, x: ' + i + ' y: ' + j + ' value: ' + value + ' x0:' + x0 + ', y0:' + y0 + ', w0:' + w0 + ', h0:' + h0 );///
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
	},

	/**
	 * 检查两点之间是否有障碍物
	 */
	checkObstacal : function( x1, y1, x2, y2 ) {
		var angle = Math.atan2( y2 - y1, x2 - x1 );
		var distance = Crafty.math.distance( x1, y1, x2, y2 );

		var offset = 0;
		while ( offset < distance ) {
			var xLen = offset * Math.cos( angle );
			var yLen = offset * Math.sin( angle );

			var x = x1 + xLen;
			var y = y1 + yLen;

			if ( this.checkBlock( x, y, this.tileSize, this.tileSize ) ) {
				return true;
			}

			offset += this.tileSize;
		}

		return false;
	}
};
