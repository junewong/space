var Grids  = function( wLength, hLength, width, height ) {
	this.width = width;
	this.height = height;
	this.wLength = wLength;
	this.hLength = hLength;
	this.clickCallback = null;
};

Grids.prototype = {

	createAt : function( root ) {
		root = root || document.body;
		
		for ( var y = 0; y < this.hLength; y++ ) {

			var row = document.createElement( 'div' );
			row.className = 'grid-row';

			for ( var x = 0; x < this.wLength; x++ ) {
				var id = this.getId( x, y );
				if ( ! id ) continue;
				var grid = this.createGrid( x, y );
				row.appendChild( grid );
			}

			root.appendChild( row );
		}
	},

	 getId : function( x, y ) {
		 if ( x < 0 || x >= this.wLength 
				 || y < 0 || y >= this.hLength ) {
					 return null;
		 }

		 return "cell_" + x + "_" + y;
	 },

	 getGrid : function( x, y ) {
		 var id = this.getId( x, y );
		 if ( !id ) return null;
		 return document.getElementById( id );
	 },

	 createGrid : function( x, y ) {
		 var _this = this;
		 var id = this.getId( x, y );
		 if ( ! id ) return null;
		 var div  = document.createElement( 'div' );
		 div.id = id;
		 //div.setAttribute( 'style', 'width:' + this.width + ';height:' + this.height +  ';float:left;background-color:red; border:1px solid gray;' );
		 div.style.width = this.width + 'px';
		 div.style.height = this.height + 'px';
		 div.className = "grid-cell";
		 div.addEventListener( 'click', function() {
			 if ( _this.clickCallback ) {
				 _this.clickCallback( x, y, div );
			 }
		 });
		 return div;
	 },

	 onClick : function( callback ) {
		 this.clickCallback = callback;
	 },

	 getGridColor : Function( i ) {
		 if ( i < 0  || i > GridColors.length ) {
			 return GRID_COLOR_DEFAULT ;
		 }
		 return GridColors[i];
	 }

};



var GirdColors = [ 'red', 'blue', 'yellow', 'green', 'purple', 'pink' ];
var GRID_COLOR_DEFAULT = 'white';
