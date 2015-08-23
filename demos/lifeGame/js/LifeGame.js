/**
 * 康德生命游戏
 *
 * @author junewong
 * @date 2015-08-23
 *
 * @import Grids.js Cell.js
 */
var LifeGame = function( wLength, hLength, size ) {
	this.wLength = wLength || 50;
	this.hLength = hLength || 34;
	this.size = size || 20;
	this.grids = null;

	this.cellList = [];
	this.cellMap = {};

	this.maxScore = 0, this.currentScore = 0, this.step = 0;

	this._isPlaying = false;
	this.handle = null;

	this.nextCallback = null;
};

LifeGame.prototype = {

	_initGrids : function( root ) {
		var _this = this;

		this.grids = new Grids( this.wLength, this.hLength, this.size, this.size );
		this.grids.createAt( document.getElementById( 'container' ) );

		this.grids.onClick( function( x, y, grid ) {
			//console.log( "click " + x + ", " + y );///
			if ( false == _this._isPlaying ) {
				var id = Cell.getId( x, y );
				var cell = _this.cellMap[ id ];
				if ( cell ) {
					cell.setLive( cell.isAlive() ? 0 : 1 );
				}
			}
		});
	},

	_initCells : function() {
		var _this = this;

		for ( var y = 0; y < this.hLength; y++ ) {

			for ( var x = 0; x < this.wLength; x++ ) {
				var cell = new Cell( x, y );
				var id = cell.getId();
				this.cellList.push( cell );
				this.cellMap[ id ] = cell;

				cell.onFetchCell( function( x, y, id ) {
					var cell = _this.cellMap[ id ];
					return cell;
				});

				cell.onChange( function( life ) {
					//console.log( this.getId() + " : " + life );///
					var grid =  _this.grids.getGrid( this.x, this.y );

					if ( this.isAlive() ) {
						grid.className = 'grid-cell alive';
					} else {
						grid.className = 'grid-cell';
					}

				});
			}
		};
	},

	_initInfo : function() {
		this.maxScore = 0;
		this.currentScore = 0;
		this.step = 0;
	},

	_eachCell : function( callback ) {
		for ( var i = 0; i < this.cellList.length; i++ ) {
			var cell = this.cellList[i];
			if ( ! cell ) continue;
			callback( cell );
		}
	},

	next : function() {
		var _this = this;

		this.currentScore = 0;

		this._eachCell( function( cell ) {
			cell.checkAlive();
		});

		this._eachCell( function( cell ) {
			cell.change();

			if ( cell.isAlive() ) {
				_this.currentScore ++;
			}
		});

		// show info:
		this.step ++;
		this.maxScore = Math.max( this.maxScore, this.currentScore );

		// callback:
		this.nextCallback 
			&& this.nextCallback( this.step, this.currentScore, this.maxScore );
	},

	reset : function() {
		this._eachCell( function( cell ) {
			cell.setLive( CELL_DEATH );
		});
	},

	getCode : function() {
		var points = [];
		this._eachCell( function( cell ) {
			if ( cell.isAlive() ) {
				points.push( '['  + cell.x + ',' +  cell.y + ']' );
			}
		});
		return '[' + points.join(',') + ']';
	},

	initWithCode : function( code ) {
		if ( !code ) return;
		try {
			var points = eval( code );
			this.reset();
			this.init( points );
		} catch( e ) {
			console.log( e );
			return;
		}
	},

	// init if need:
	init : function( points ) {
		points = points || [];

		for ( var i in points ) {
			var p = points[i];
			var id = Cell.getId( p[0], p[1] );
			var cell = this.cellMap[ id ];
			if ( cell ) {
				cell.setLive( CELL_ALIVE );
			}
		};
	},

	play : function() {
		var _this = this;

		this._isPlaying = true;

		function autoRun() {
			// 获取每次的动画帧
			setTimeout( function() {
				if ( _this._isPlaying ) {
					_this.handle = requestAnimationFrame( autoRun );
					_this.next();
				}
			}, 150 );
		}

		autoRun();
	},

	pause : function() {
		this._isPlaying = false;
		cancelAnimationFrame( this.handle );
		this.handle  = null;
	},

	isPlaying : function() {
		return !! this._isPlaying;
	},

	eachStepCallback : function( callback ) {
		this.nextCallback = callback;
	},

	// create game at the DOM
	createAt : function( root ) {
		this._initInfo();
		this._initGrids( root );
		this._initCells();

		this.init();
	}
};
