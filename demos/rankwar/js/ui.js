/**
 *  @import Grids.js
 */
var RankBoard = Class({
	init : function() {
		this.grids = null;
		this.root = null;
	},

	createAt : function( root, actors ) {
		this.root = root;

		var _this = this;

		this.grids = new Grids( 10, 10, 88, 108 );
		this.grids.onCreate( function( grid, i, x, y ) {
			var id = 'index_' + grid.id;
			if ( actors && actors[ i ] ) {
				var actor = actors[ i ];
				actor.showLifeBar( actor.shouldShowLifeBar );
				grid.appendChild( actor.getNode() );

			} else {
				grid.appendChild( _this._createInnerGrid( id, i ) );
			}
		});
		this.grids.createAt( root );
	},

	clean : function() {
		if ( ! this.root ) return;
		while ( this.root.lastChild ) {
			this.root.removeChild( this.root.lastChild );
		}
	},

	_createInnerGrid : function( id, index ) {
		var div = C( 'div', id );
		div.className = 'rank-index';
		div.innerHTML = index + 1;
		return div;
	}
});

