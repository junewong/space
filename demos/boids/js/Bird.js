var Bird = function(id) {

	this.id = id;
	this.element = null;
	this.meterial_id = this.id ? 'meterial_' + this.id : '';

	this.init();
};

Bird.prototype = {

	init : function() {

		var transform = document.createElement('transform');
		transform.id = 'transform_' + this.id;
		transform.innerHTML = ''
		    + "  <transform id='" + this._axisName( 'x' ) + "' rotation='1 0 0 0'> "
		    + "  	<transform id='" + this._axisName( 'y' ) + "' rotation='0 1 0 0'> "
		    + "  		<transform id='" + this._axisName( 'z' ) + "' rotation='0 0 1 0'> "
		    + "  			<shape> "
			+ "  			   <appearance> "
			+ "	 			      <material id='" + this.meterial_id + "'diffuseColor='1 1 1'></material> "
			+ "  			   </appearance> "
			+ "  			   <cone></cone> "
		    + "  			</shape> "
		    + "  		</transform> "
		    + " 	</transform> "
		    + "  </transform> ";

		this.element = transform;
	},

	move : function( position ) {
		var positionString = position.toArray().join( ' ' );
		this.element.setAttribute( 'translation',  positionString );

	},

	rotate : function ( velocity ) {
		// 返回y轴到向量的夹角
		//var v = velocity.divide( velocity.min() );
		//var angle = -1 * Math.atan2( v.y, Math.sqrt(v.x*v.x + v.z*v.z)) * (v.x * v.z < 0 ? -1 : 1);
		//var angle = Math.atan2( v.y, Math.sqrt(v.x*v.x + v.z*v.z));
		//var angleZX = Math.atan2( v.z, v.y );
		//var x2 = Math.cos( angleZX ) * v.z  / Math.cos( (Math.PI * 0.5 - angleZX) );
		//var rotationString = [ 1, 0, 1, angle*Math.PI*2 ].join(' ');
		//this.element.setAttribute( 'rotation', rotationString );

		var v = velocity;
		this._rotateAxis( 'x', Math.atan2( v.z, v.y) - Math.PI/2 );
		this._rotateAxis( 'y', -1 * Math.atan2( v.x, v.z) - Math.PI/2 );
		this._rotateAxis( 'z', -1 * Math.atan2( v.x, v.y) - Math.PI/2 );
		if (this.id == 0) {// debug
			console.log("rotate :" + rotationString + " length: " + velocity.length() + " angle: " + angle );///
		};
	},

	// 对指定xyz其中一轴旋转一个角度
	_rotateAxis : function ( axis, angle ) {
		var node = document.getElementById( this._axisName( axis ) );
		var rotation = node.getAttribute('rotation');
		var values = rotation.split(' ');
		values[3] = angle;
		node.setAttribute( 'rotation', values.join(' ') );
	},

	setColor : function ( color ) {

		if ( this.meterial_id ) {
			document.getElementById( this.meterial_id ).setAttribute('diffuseColor', color);
		};
		
	},

	_axisName : function ( axis ) {
		return 'transform_' + axis + '_' + this.id;
	}
};


