/**
 * 任务管理器
 */
var TaskManager = function () {
	this.tasks = [];
};
TaskManager.prototype = {

	add : function( task ) {
		this.tasks.push( task );
	},

	getTask : function() {
		var len = this.tasks.length;
		if ( ! len  ) {
			return null;
		}
		var task, i = len;
		while ( --i >= 0 ) {
			task = this.tasks[ i ];
			if ( task && task.check.apply( task, arguments ) ) {
				break;
			}
		}
		return task;
	},
	
	execute : function() {
		var task = this.getTask.apply( this, arguments );
		if ( task ) {
			// 如果最后一个是回调函数，则将它替换成新准备的callback函数，
			// 等task的excute里回调该callback函数之后，
			// 才调用这个真正的回调函数
			var args = argumentsToArray( arguments );
			var len = args.length;
			var last = len > 0 ? args[ len - 1 ] : null;
			if ( last && typeof last === 'function'  ) {
				args = args.slice( 0, len - 1 );
			}

			var callback = function() {
				if ( last ) {
					last.apply( this, arguments );
				}
			}
			return task.execute.apply( task, args.concat( [ callback ] ) );
		}
		return false;
	}
};

/**
 * 任务的基类
 */
var TaskBase = Class({
	init : function() {
	},

	check : function() {
		return false;
	},

	execute : function() {
		// pass
	}
});

/**
 * 随机找一个最近的敌人进行战斗
 */
var RandomFightTask = Class( TaskBase, {
	init : function( ) {
	},

	check : function( me ) {
		return true;
	},

	execute : function( me, callback )  {
		var actor = this._getClosestActor( me );
		if ( !actor ) {
			return false;
		}

		var offset = 100;
		var pos = besidePos( actor.x, actor.y, offset, me.w, me.h );

		me.rotateAndMoveTo( pos, true, function() {
			if ( callback && typeof callback === 'function' ) {
				callback();
			}
		});
		return true;
	},

	_getClosestActor : function( me )  {
		var actor, minDistance = 999999;
		Crafty( 'Actor' ).each( function() {
			if ( this === me || ( this.groupId > 0 && this.groupId === me.groupId ) ) {
				return;
			}
			var distance = Crafty.math.distance( me.x, me.y, this.x, this.y );
			if ( distance < minDistance ) {
				minDistance = distance;
				actor = this;
			}
		});

		return actor;
	}
});

/**
 * 攻击对方的基地，保卫自己的基地
 */
var BaseBuildingFightTask = Class( TaskBase, {
	init : function( ) {
		Crafty.bind( 'BaseBuildingDestroy', function( building ) {
			var groupId = building.groupId;
			var text = '第' + groupId + '组取得胜利！';
			Crafty.e( '2D, Canvas, Text')
					.textFont( { size: '80px', weight: 'bold' } )
					.text( text )
					.attr( { x:CANVAS_WIDTH/2 - 300, y: CANVAS_HEIGHT/2, w:CANVAS_WIDTH, h:CANVAS_HEIGHT } );
			setTimeout( function() {
				Crafty.pause();
			}, 500 );
		});
	},

	check : function( me ) {
		return !! this._getTargetBaseBuilding( me );
	},

	execute : function( me, callback )  {
		var building = this._getTargetBaseBuilding( me );
		if ( ! building ) {
			return false;
		}

		var offset = 100;
		var pos = besidePos( building.x, building.y, offset, building.w, building.h );

		me.rotateAndMoveTo( pos, true, function() {
			if ( callback && typeof callback === 'function' ) {
				callback();
			}
		});
		return true;
	},

	_getTargetBaseBuilding : function( me )  {
		var building;
		Crafty( 'BaseBuilding' ).each( function() {
			if ( this.groupId > 0 && this.groupId === me.groupId ) {
				return;
			}
			if ( ! building ) {
				building = this;
			}
		});

		return building;
	}
});

var TASK_MAPS = {
	'randomFight' : RandomFightTask,
	'baseBuildingFight' : BaseBuildingFightTask
};
