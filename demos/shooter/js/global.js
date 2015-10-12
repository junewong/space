var gUID =  0;
function UID() {
    return ++gUID;
}

function toAngle( x, y , rotation, distance ) {
	rotation = rotation % 360;
	var p = Math.PI * 2 * ( rotation - 90 ) / 360;
	var toX = x + Math.cos( p ) * distance;
	var toY = y + Math.sin( p  ) * distance;
	return { x: toX, y: toY };
}

function die( entity, callback ) {
	var w = entity.w * 1.2;
	var h = entity.h * 1.2;
	entity.tween( {w: w, h:h, alpha:0.2}, 300 )
		.bind( 'TweenEnd', function() {
			if ( Game.battleMap ) {
				Game.battleMap.removeBlock( entity.x, entity.y, entity.w, entity.h );
			}
			Crafty.trigger( 'Dead', entity );
			entity.destroy();
			if ( callback ) {
				callback();
			}
		});

}

function extend( target, obj) {
	var newObj = Crafty.clone( target );
	for (var key in obj) {
		newObj[key] = obj[key];
	}
	return newObj;
}

function randInt( a, b ) {
	return Crafty.math.randomInt( a, b );
}

function checkCanvasOut( x, y ) {
	 if ( x <= 0 || x >= CANVAS_WIDTH || y <= 0 || y >= CANVAS_HEIGHT ) {
		 return true;
	 }
	 return false;
}

function randPosition( w, h ) {
    var x = randInt( 0, CANVAS_WIDTH - (w || 0) );
    var y = randInt( 0, CANVAS_HEIGHT - (h || 0) );
	return {x:x, y:y };
}

function randomCreateEntity( count, map, callback ) {
	var i = 0;
	var entity = null;

	while( i < count ) {
		if ( entity === null ) {
			entity = callback( i );
		}

		var p = randPosition( entity.w, entity.h );

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


