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

	getBlock: function( x0, y0 ) {
		var x = Math.floor( x0 / this.tileSize );
		var y = Math.floor( y0 / this.tileSize );
		return {x: x, y: y};
	},

	setValue : function( x0, y0, w0, h0, value ) {
		var x = Math.floor( x0 / this.tileSize );
		var y = Math.floor( y0 / this.tileSize );
		var w = Math.floor( w0 / this.tileSize );
		var h = Math.floor( h0 / this.tileSize );
		for ( var i = x,  xLen = x + w; i < xLen; i ++ ) {
			for ( var j = y, yLen = y + h; j < yLen; j ++ ) {
				if ( this.tiles && i < this.tiles.length && j < this.tiles[i].length ) {
					this.tiles[i][j] = value;
					//console.log( 'set tiles, x: ' + i + ' y: ' + j + ' value: ' + value + ' x0:' + x0 + ', y0:' + y0 + ', w0:' + w0 + ', h0:' + h0 );///
				}
			}
		}
	},

	checkBlock : function( x, y, w, h ) {
		if ( this.isOutofBound( x, y, w, h ) ) {
			return true;
		}

		x = Math.floor( x / this.tileSize );
		y = Math.floor( y / this.tileSize );
		w = Math.floor( w / this.tileSize );
		h = Math.floor( h / this.tileSize );
		for ( var xLen = x + w; x < xLen; x ++ ) {
			for ( var yLen = y + h; y < yLen; y ++ ) {
				if ( ! ( x < this.tiles.length && this.tiles[x] && y < this.tiles[x].length ) ) {
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
	 * 是否超出边界
	 */
	isOutofBound : function( x, y, w, h ) {
		if ( x < 0 || x + w > this.width ) {
			return true;
		}
		if ( y < 0 || y + h > this.height ) {
			return true;
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
	},

	isSameBlock: function( rect, targetX, targetY ) {
		var b1 = this.getBlock( rect.x, rect.y );
		var b2 = this.getBlock( targetX, targetY );

		return b2.x >= b1.x && b2.x <= ( b1.x + rect.w ) && 
				b2.y >= b1.y && b2.y <= ( b1.y + rect.h ) ||
				b1.x >= b2.x && b1.x <= ( b2.x + this.tileSize ) && 
				b1.y >= b2.y && b1.y <= ( b2.y + this.tileSize );

	},

	/**
	 * 根据当前坐标和目标坐标，查找一条绕过障碍物的路径
	 */
	findPath: function( e, targetX, targetY, callback ) {

		var rect = { x: e.x, y: e.y, w: e.w, h: e.h};

		var count = 100;
		var paths = [];

		// 顺时针还是逆时针
		//var direction = targetX < rect.x ? -1 : 1;
		var direction = 1;

		var lastIndex = -1;

		while ( count -- > 0 && ! this.isSameBlock( rect, targetX, targetY ) ) {
			var gridIndex = this._getGridIndex( rect.x, rect.y, targetX, targetY );

			var grid = this._getRectByGridIndex( rect, gridIndex );

			// 顺时针查找没有障碍的格子
			// 不允许走反方向的回头路
			var findCount = 0;
			while ( Math.abs( gridIndex - lastIndex ) === 4 || this.checkBlock( grid.x, grid.y, rect.w, rect.h ) ) {
				if ( findCount >= 8 ) {
					return paths;
				}
				gridIndex = ( gridIndex + direction ) % 8;
				grid = this._getRectByGridIndex( rect, gridIndex );
				findCount ++;
			}

			// 相差超过一格，说明是拐弯了，把边角补上
			if ( paths.length > 1 && gridIndex % 2 === 0 ) {
				var corner = this._getRectByGridIndex( rect, lastIndex );
				var cornerPos = {x: corner.x, y:corner.y};
				paths.push( cornerPos );
				if ( callback ) {
					callback( cornerPos );
				}
			}

			rect.x = grid.x;
			rect.y = grid.y;

			var pos = {x: rect.x, y:rect.y};
			paths.push( pos );

			if ( callback ) {
				callback( pos );
			}

			lastIndex = gridIndex;
		}

		return paths;

	},

	/**
	 * 九宫格从左上角顺时针一圈编号为0-7
	 */
	_getRectByGridIndex: function( e, i ) {
		var x, y;
		switch ( i % 8 ) {
			case 0:
				x = e.x - e.w;
				y = e.y - e.h;
				break;
			case 1:
				x = e.x;
				y = e.y - e.h;
				break;
			case 2:
				x = e.x + e.w;
				y = e.y - e.h;
				break;
			case 3:
				x = e.x + e.w;
				y = e.y;
				break;
			case 4:
				x = e.x + e.w;
				y = e.y + e.h;
				break;
			case 5:
				x = e.x;
				y = e.y + e.h;
				break;
			case 6:
				x = e.x - e.w;
				y = e.y + e.h;
				break;
			case 7:
				x = e.x - e.w;
				y = e.y;
				break;
			default:
				return e;

		}

		return {x :x, y: y, w: e.w, h: e.h};
	},

	/**
	 * 获取当期到目标的方向是属于九宫格上的哪个格子
	 */
	_getGridIndex: function( x, y, targetX, targetY ) {
		var block = this.getBlock( x, y );
		var targetBlock = this.getBlock( targetX, targetY );

		var rad = Math.atan2( targetBlock.x - block.x,  block.y - targetBlock.y );
		rad -= Math.PI/2;
		//rad = ( rad + 2 * Math.PI )  % ( 2 * Math.PI );

		/*
		var angle = ( Crafty.math.radToDeg( rad ) + 45 + 360 ) % 360;
		var index = Math.floor( angle / 45  ) % 8; // 360 / 8 = 45
		return index;
		*/

		var size = this.tileSize * 1.5;
		var half = this.tileSize /2;

		var checkX = Math.cos( rad ) * size;
		var checkY = Math.sin( rad ) * size;

		var offsetX = checkX;
		var offsetY = checkY;

		if ( offsetX < -half && offsetY < -half ) {
			return 0;

		} else if (  offsetX >= -half && offsetX < half && offsetY < -half ) {
			return 1;

		} else if (  offsetX >= half && offsetY <= -half ) {
			return 2;

		} else if (  offsetX >= half && offsetY >= -half && offsetY < half ) {
			return 3;

		} else if (  offsetX >= half && offsetY >= half ) {
			return 4;

		} else if (  offsetX >= -half && offsetY < half  && offsetY >= half ) {
			return 5;

		} else if ( offsetX < -half && offsetY >= half ) {
			return 6;

		} else if ( offsetX < -half && offsetY >= -half && offsetY < half ) {
			return 7;
		}

		return null;
	}
};
