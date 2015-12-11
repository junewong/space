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

function die( entity, callback ) {
	var w = entity.w * 1.2;
	var h = entity.h * 1.2;
	entity.tween( {w: w, h:h, alpha:0.2}, 300 )
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

function point( x, y ) {
	if ( y === undefined ) {
		var o = x;
		return {x: o.x, y: o.y };
	}
	return {x: x, y: y };
}

function rect( entity ) {
	return {x: entity.x, y: entity.y, w: entity.w, h: entity.h };
}

function randomCreateEntity( count, map, callback ) {
	var i = 0;
	var entity = null;

	while( i < count ) {
		if ( entity === null ) {
			entity = callback( i );
		}

		var p = ( entity.x || entity.y ) ? 
					point( entity.x, entity.y ) :
					fixPos( randPosition( entity.w, entity.h ), entity.w, entity.h );

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
 * 获取最近的敌方建筑
 */
function getNearbyTargetBuliding( actor ) {
	var targetBuilding;
	var minDistance = Number.MAX_VALUE;

	Crafty( "BaseBuilding" ).each( function( i ) {
		building = this;
		if ( building.groupId != actor.groupId  ) {
			var distance = Crafty.math.distance( building.x, building.y, actor.x, actor.y );
			if ( distance < minDistance ) {
				targetBuilding = building;
				minDistance = distance;
			}
		}
	});
	return targetBuilding;
}

function getNearbyTargetBulidingPos( actor ) {
	var building = getNearbyTargetBuliding( actor );
	if ( ! building ) {
		return building;
	}
	return besidePos(building.x, building.y, building.h, building.w, building.h );
}


var Arrays = {
	shuffle : function( array ) {
		array.sort( function( a, b ){  
			return Math.floor(Math.random() * 3) - 1;  
		}); 
		return array;
	}
};
