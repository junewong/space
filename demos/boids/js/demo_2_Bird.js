var Bird = function(id) {

	this.id = id;
	this.element = null;

	this.init();
};

Bird.prototype = {

	init : function() {
		var transform = document.createElement('transform');
		transform.id = this.id || '';
		transform.innerHTML = ''
		    + "  <shape> "
			+ "     <appearance> "
			+ "	       <material diffuseColor='1 1 1'></material> "
			+ "     </appearance> "
			+ "     <sphere></sphere> "
		    + "  </shape> ";

		this.element = transform;
	},

	move : function( position ) {
		var positionString = position.toArray().join( ' ' );
		this.element.setAttribute( 'translation',  positionString );
	}
};


