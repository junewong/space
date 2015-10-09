Crafty.c( "Bullet", {
	init: function() {
		this.requires( '2D, Canvas, Color, Tween, Collision' )
			.color('red');

	}
});

/**
 * 武器，基类
 */
var Weapon = function( owner, config ) {
	this.owner = owner;
	this.total = 0;

	this.config = extend( {
		max : 4,
		distance : 300,
		time : 1000,
		bulletSize : 4,
		damage : 2,
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
			.attr({ x:x, y:y, w:_this.config.bulletSize, h:_this.config.bulletSize, alpha:1, owner:_this.owner, damage: this.config.damage } )
			.origin( this.w /2, this.height /2 )
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

/**
 * 手枪
 */
var HandGun = function( owner ) {
	return new Weapon( owner );
};

/**
 * 狙击枪
 */
var SniperGun = function( owner ) {
	var config = {
		max : 1,
		distance : 600,
		time : 800,
		damage : 5,
		bulletSize : 6
	};
	return new Weapon( owner, config );
};

/**
 * 冲锋枪 
 */
var TommyGun = function( owner ) {
	var config = {
		max : 20,
		distance : 300,
		time : 1000,
		damage : 1,
		bulletSize : 2
	};
	return new Weapon( owner, config );
};

/**
 * 散弹枪 
 */
var ScatterGun = function( owner ) {
	var config = {
		max : 8,
		distance : 150,
		time : 500,
		damage : 3,
		bulletSize : 4,
		randRotation : 30 
	};
	return new Weapon( owner, config );
};

/**
 * 鞭枪 
 */
var WhipGun = function( owner ) {
	var max = 24;
	var index = 0;
	var config = {
		max : max,
		distance : 100,
		time : 200,
		damage : 4,
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

var WEAPON_LIST = [ HandGun, TommyGun, SniperGun, ScatterGun, WhipGun ];
var WEAPON_COLOS = [ 'blue', 'red', 'orange', 'green', 'pink' ];
