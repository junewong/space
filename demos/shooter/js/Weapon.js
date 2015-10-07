Crafty.c( "Bullet", {
	init: function() {
		this.requires( '2D, Canvas, Color, Tween, Collision' )
			.color('red');

	}
});

var Weapon = function( owner, config ) {
	this.owner = owner;
	this.total = 0;

	this.config = extend( {
		max : 4,
		distance : 300,
		time : 1000,
		bulletSize : 4,
		randRotation : 0,
		rotationCallback : null
	}, config || {} );

	this.shootTo = function( x, y, rotation ) {
		var _this = this;

		if ( this.config.randRotation > 0 ) {
			var rand = randInt( -1 * this.config.randRotation, this.config.randRotation );
			rotation += rand;
		}
		
		if ( this.config.rotationCallback ) {
			rotation = this.config.rotationCallback( rotation );
		}

		var point = toAngle( x, y, rotation, _this.config.distance );
		if ( _this.total  >= this.config.max ) {
			return;
		}
		_this.total ++;
		Crafty.e( 'Bullet' )
			.attr({ x:x, y:y, w:_this.config.bulletSize, h:_this.config.bulletSize, alpha:1, owner:_this.owner } )
			.tween( {x: point.x, y:point.y, alpha:0.3}, _this.config.time )
			.one( 'TweenEnd', function() {
				_this.total --;
				this.destroy();
			})
			.onHit( "Wall", function() {
				_this.total --;
				this.destroy();
			})
			.onHit( "Bullet", function() {
				_this.total --;
				this.destroy();
			});

	};

	this.isOwner = function( bullet ) {
		return this.owner === bullet.owner;
	};
};

var HandGun = function( owner ) {
	return new Weapon( owner );
};

var SniperGun = function( owner ) {
	var config = {
		max : 1,
		distance : 600,
		time : 800,
		bulletSize : 6
	};
	return new Weapon( owner, config );
};

var TommyGun = function( owner ) {
	var config = {
		max : 20,
		distance : 300,
		time : 1000,
		bulletSize : 2
	};
	return new Weapon( owner, config );
};

var ScatterGun = function( owner ) {
	var config = {
		max : 8,
		distance : 150,
		time : 500,
		bulletSize : 4,
		randRotation : 30 
	};
	return new Weapon( owner, config );
};

var ShieldGun = function( owner ) {
	var max = 24;
	var index = 0;
	var config = {
		max : max,
		distance : 100,
		time : 200,
		bulletSize : 4,
		rotationCallback : function( rotation ) {
			index ++;
			if ( index >= max ) {
				index = 0;
			}
			return index / max * 360;
		}
	};
	return new Weapon( owner, config );
};

var WEAPON_LIST = [ HandGun, TommyGun, SniperGun, ScatterGun, ShieldGun ];
var WEAPON_COLOS = [ 'blue', 'red', 'orange', 'green', 'pink' ];
