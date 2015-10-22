
var Skill = function( name, owner, config ) {
	this.name = name;

	this.owner = owner;
	this.total = 0;

	this.running = false;

	this.config = extend( {
		max : 10,
		distance : 300,
		time : 1000,
		bulletSize : 4,
		damage : 2,
		showName : true,
		shoot : function() {}

	}, config || {} );

	this.shootTo = function( x, y, rotation ) {
		if ( this.running ) {
			return;
		}
		this.running = true;
		if ( this.config.showName ) {
			this.showSkillName( x, y );
		}
		var _this = this;
		return this.config.shoot( x, y, rotation, function() {
			_this.running = false;
		});
	};

	this.isOwner = function( bullet ) {
		return this.owner === bullet.owner;
	};

	var _this = this;

	this.showSkillName = function( x, y ) {
		var width = 100, height = 40, offsetX = x - width /2;

		Crafty.e( '2D, Canvas, Color, Tween, Text' )
			.text( _this.name )
			.textFont( { size: '24px', weight: 'bold' } )
			.attr( { x: offsetX, y: y - 10, w:width, h:height, alpha:1 } )
			.tween( {x: offsetX, y: y - 90, alpha:0.4}, 900 )
			.one( 'TweenEnd', function() {
				this.destroy();
			});

	};
};

/**
 * 技能：烈日光辉
 * AOE类型攻击
 */
var SunShineSkill = function( owner ) {

	var config = {

		distance : 250,
		damage: 8,
		circleCount : 24,
		time : 1000,

		shoot : function( x, y, rotation, callback ) {
			var _this = this;

			var j = this.max;

			var offset = this.circleCount / 3;

			function run() {

				for ( var i = 0; i < _this.circleCount; i++ ) {
					var r = 360 * i / _this.circleCount + ( j * offset );

					var point = toAngle( x, y, r, _this.distance );

					Crafty.e( 'Bullet' )
						.attr( { x:x, y:y, w:_this.bulletSize, h:_this.bulletSize, alpha:1, owner:owner, damage: _this.damage } )
						.origin( this.w /2, this.height /2 )
						.tween( {x: point.x, y:point.y, alpha:0.3}, _this.time )
						.one( 'TweenEnd', function() {
							this.destroy();
						})
						.onHit( "Wall", function() {
							this.destroy();
						})
						.onHit( "Bullet", function() {
							this.destroy();
						});
				}

				if ( j > 0 ) {
					setTimeout( run, 120 );
					j--;
				} else {
					callback();
				}
			}

			run();

		}
	};

	return new Skill( '烈日光辉', owner, config );
};


var SKILL_LIST = [ SunShineSkill ];
