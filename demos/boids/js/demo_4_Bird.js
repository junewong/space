var Bird = function(id) {

	this.id = id;
	this.element = null;
	this.meterial_id = this.id ? 'meterial_' + this.id : '';

	this.init();
};

Bird.prototype = {

	init : function() {

		var transform = document.createElement('transform');
		transform.id = this.id || '';
		transform.innerHTML = ''
		    + "  <shape> "
			+ "     <appearance> "
			+ "	       <material id='" + this.meterial_id + "'diffuseColor='1 1 1'></material> "
			+ "     </appearance> "
			+ "     <cone></cone> "
		    + "  </shape> ";

		this.element = transform;
	},

	move : function( position ) {
		var positionString = position.toArray().join( ' ' );
		this.element.setAttribute( 'translation',  positionString );

	},

	rotate : function ( velocity ) {
		var negative = velocity.negative();
		var rotationString = [- negative.z, -negative.x, -negative.y, negative.toAngles().phi].join(' ');
		this.element.setAttribute( 'rotation', rotationString);
	},

	setColor : function ( color ) {

		if ( this.meterial_id ) {
			document.getElementById( this.meterial_id ).setAttribute('diffuseColor', color);
		};
		
	}
};


