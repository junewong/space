var gUID =  1;
function UID() {
    return ++gUID;
}

/**
 * 将arguments对象转换成数组
 */
function argumentsToArray( args ) {
	var array = [];
	for( var i in args ) {
		array.push( args[i] );
	}
	return array;
}

function validatePos( pos ) {
	if ( isNaN( pos.x ) || isNaN( pos.y ) ) {
		return false;
	}
	return true;
}

function toAngle( x, y , rotation, distance ) {
	rotation = rotation % 360;
	var p = Math.PI * 2 * ( rotation - 90 ) / 360;
	var toX = x + Math.cos( p ) * distance;
	var toY = y + Math.sin( p  ) * distance;
	return { x: toX, y: toY };
}

function fixPos( pos, w, h ) {
	w = w || 0;
	h = h || 0;

	if ( pos.x < 0 ) {
		pos.x = 0;
	} else if ( pos.x > CANVAS_WIDTH - w) {
		pos.x = CANVAS_WIDTH - w;
	}

	if ( pos.y < 0 ) {
		pos.y = 0;
	} else if ( pos.y > CANVAS_HEIGHT - h) {
		pos.y = CANVAS_HEIGHT - h;
	}

	pos.x = pos.x || 0;
	pos.y = pos.y || 0;

	return pos;
}

function die( entity, callback, rate ) {
	rate = rate || 1.2;
	var w = entity.w * rate;
	var h = entity.h * rate;
	entity.tween( {w: w, h:h, alpha:0.2}, 400 )
		.bind( 'TweenEnd', function() {
			if ( Game.battleMap ) {
				Game.battleMap.removeBlock( entity.x, entity.y, entity.w, entity.h );
			}

			if ( entity.has( 'Actor' ) ) {
				Crafty.trigger( 'ActorDead', entity );
			}
			Crafty.trigger( 'Dead', entity );

			entity.destroy();
			entity = null;
			if ( callback ) {
				callback();
			}
		});

}

function isLiving( entity ) {
	if ( ! entity || ! entity.getId ) {
		return false;
	}

	var id = entity.getId();
	if ( ! id ) {
		return false;
	}

	if ( !! Crafty( entity.getId() ).get( 0 ) ) {
		return true;
	}

	return false;
}

function extend( target, obj) {
	var newObj = Crafty.clone( target );
	for (var key in obj) {
		if ( key === 'init' ) {
			newObj.superInit = newObj[ key ];
		}
		newObj[ key ] = obj[ key ];
	}
	return newObj;
}

function randInt( a, b ) {
	return Crafty.math.randomInt( a, b );
}

function checkCanvasOut( x, y ) {
	if ( isNaN( x ) || isNaN( y ) ) {
		return false;
	}
	 if ( x < 0 || x > CANVAS_WIDTH || y < 0 || y > CANVAS_HEIGHT ) {
		 return true;
	 }
	 return false;
}

function randPosition( w, h ) {
    var x = randInt( 0, CANVAS_WIDTH - (w || 0) );
    var y = randInt( 0, CANVAS_HEIGHT - (h || 0) );
	return {x:x, y:y };
}

function besidePos( x, y, offset, w, h ) {
	w = w || 0;
	h = h || 0;
	x = x + randInt( -offset, offset );
	y = y + randInt( -offset, offset );

	var pos = fixPos( {x: x, y: y}, w, h );
	return pos;
}

function randomCreateEntity( count, map, callback ) {
	var i = 0;
	var entity = null;

	while( i < count ) {
		if ( entity === null ) {
			entity = callback( i );
		}

		var pos = randPosition( entity.w, entity.h );
		var p = fixPos( pos, entity.w, entity.h );

		if ( ! map || ! map.checkBlock( p.x, p.y, entity.w, entity.h ) ) {
			entity.attr( {x: p.x, y: p.y} );
			if ( map ) {
				map.addEntity( entity );
			}
			entity = null;
			i++;
		}
	}
}

/**
 * 显示小提示，然后消失隐藏
 * e.g.:
 * 	showTip( 'ABC', 100, 100 );
 * 	showTip( 'ABC', actor );
 */
function showTip( text, x, y ) {
	if ( x && y === undefined ) {
		var entity = x;
		x = entity.x + entity.w/2;
		y = entity.y;
	}

	var width = 100, height = 40, offsetX = x - width /2;

	Crafty.e( '2D, Canvas, Color, Tween, Text' )
		.text( text )
		.textFont( { size: '24px', weight: 'bold' } )
		.attr( { x: offsetX, y: y - 10, w:width, h:height, alpha:1 } )
		.tween( {x: offsetX, y: y - 90, alpha:0.4}, 900 )
		.one( 'TweenEnd', function() {
			this.destroy();
		});
}

function Flash( entity, config ) {
		var _this = this;

		this.count = undefined;
		this.time = 1300;
		this.minAlpha = 0.1;
		this.maxAlpha = 1;

		if ( config ) {
			for ( var k in config ) {
				this[k] = config[k];
			}
		}

		var flashDirection = 1;
		function once() {
			var alpha = flashDirection === 1 ? _this.minAlpha : _this.maxAlpha;
			entity.tween( {alpha: alpha}, _this.time);
		}

		entity.bind( 'TweenEnd', function() {
			flashDirection *= -1;
			if ( _this.count === undefined ) {
				once();
			} else if ( _this.count > 0 ) {
				once();
				_this.count --;
			}
		});
		once();
}


var Arrays = {
	shuffle : function( array ) {
		array.sort( function( a, b ){  
			return Math.floor(Math.random() * 3) - 1;  
		}); 
		return array;
	}
};
