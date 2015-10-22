
Crafty.c( 'SkillObstacle', {
});

Crafty.c( 'Rock', {
	init: function() {
		var _this = this;

		this.requires( '2D, Canvas, Color, Tween, Collision' )
			.attr( {w:20, h:20} )
			.color( 'black' );

		this.onHit('Bullet', function() {
			die( _this );
		});
	}
});

Crafty.c('Wall', {
	init: function() {
		this.requires('2D, Canvas, Color')
		.color('gray');
	}
});


//Ball
Crafty.c( "Ball", {
	init: function() {
		var _this = this;
		var frame = 0;
		var isRunning = true;
		this.requires( '2D, Canvas, Color, Tween, Collision' )
			.color('red')
			.attr({ x: 10, y: 10, w: 20, h: 20,
					dX: Crafty.math.randomInt(2, 6),
					dY: Crafty.math.randomInt(2, 6) })
			.bind('EnterFrame', function () {
				if ( ! isRunning ) {
					return;
				}
				frame ++;
				if ( frame % 3 === 0 ) {
					return;
				}

				if ( this.x <= 0 || this.x >= CANVAS_WIDTH )
					this.dX *= -1;

				if ( this.y <= 0 || this.y >= CANVAS_HEIGHT )
					this.dY *= -1;

				this.x += ( this.dX + randInt( -2, 2 ) );
				this.y += ( this.dY + randInt( -2, 2 ) );
			})
			.onHit('Wall', function ( all ) {
				var obj = all[0].obj;
				this.reflect( obj );
			})
			.onHit('Rock', function ( all ) {
				var obj = all[0].obj;
				this.reflect( obj );
			});

			this.onHit('Bullet', function () {
				isRunning = false;
				die( _this );
			});

	},

	reflect : function( obj ) {
		if ( this.x + this.w >= obj.x + this.w && this.x - this.w <= obj.x + obj.w ) {
			this.dY *= -1;
		}
		if ( this.y + this.h >= obj.y + this.h && this.y - this.h <= obj.y + obj.h ) {
			this.dX *= -1;
		}
	}

});


Crafty.c( 'WeaponPill', {
	init: function() {
		var _this = this;
		this.weaponClass = null;
		
		var flashDirection = 1;

		this.requires( '2D, Canvas, Color, Tween, Collision' )
			.attr({ w: 12, h: 12 });

		function flash() {
			var alpha = flashDirection === 1 ? 0.1 : 0.8;
			_this.tween( {alpha: alpha}, 1300 );
		}

		this.bind( 'TweenEnd', function() {
			flashDirection *= -1;
			flash();
		});

		flash();

		this.onHit('Player', function() {
			die( _this );
		});
		this.onHit('Soldier', function() {
			die( _this );
		});
	},

	setWeapon : function( weaponClass ) {
		this.weaponClass = weaponClass;
	},

	getWeapon : function() {
		return this.weaponClass;
	}, 

	setWeaponColor : function( color ) {
		this.color( color );
	},

});
