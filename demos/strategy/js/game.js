
var StrategyGame = Class({

	init : function() {
		this.strategies = [];
		this.step = 0;
		this.maxStep = 100;
		this.value = 0;
		this.total = 0;

		this._isPlaying = false;
		this.handle = null;

		this.dealCallback = null;
		this.deathCallback = null;
		this.nextCallback = null;
		this.endCallback = null;
	},

	setMaxStep : function( maxStep ) {
		this.maxStep = maxStep;
	},

	next : function() {
		this.step += 1;

		for ( var i in this.strategies ) {
			var a = this.strategies[i];
			if ( a.isDead() ) {
				continue;
			}

			for ( var j in this.strategies ) {
				var b = this.strategies[j];
				if ( a === b || a.isDead() || b.isDead() ) {
					continue;
				}
				this._deal( a, b );
			}
		}

		if ( this.nextCallback ) {
			this.nextCallback( this.step );
		}

		if ( this.step >= this.maxStep ) {
			this.pause();
			if ( this.endCallback ) {
				this.endCallback( this.step );
			}
		}
	},

	addStrategy : function( strategy ) {
		this.strategies.push( strategy );
		strategy.setId ( this.strategies.length );

		this.total += strategy.getValue();
	},

	getTotal : function() {
		return this.total;
	},

	getAvgTotal : function() {
		return this.strategies.length == 0 ? 0 : parseInt( this.total / this.strategies.length );
	},

	play : function() {
		var _this = this;

		this._isPlaying = true;

		function autoRun() {
			// 获取每次的动画帧
			setTimeout( function() {
				if ( _this._isPlaying ) {
					_this.handle = requestAnimationFrame( autoRun );
					_this.next();
				}
			}, 150 );
		}

		autoRun();
	},

	pause : function() {
		this._isPlaying = false;
		cancelAnimationFrame( this.handle );
		this.handle  = null;
	},

	isPlaying : function() {
		return !! this._isPlaying;
	},

	_changeTotal : function( offset ) {
		this.total += offset;
	},

	_deal : function( a, b ) {
		var action = a.deal( b );
		a.increaseStep();
		a.context.addAction( b.getId(), action );

		// 没有动作
		if ( action === ACTION_NONE ) {
			return;
		}

		var answer = b.answer( a, action );
		var valueA = 0, valueB = 0, total = 0;

		if ( answer == ACTION_COOPERATE ) {
			valueA = 1;
			valueB = 1;
			total = 2;

		} else if ( answer == ACTION_CHEAT) {
			valueA = -2;
			valueB = 2;
			total = 0;
		}

		a.changeValue( valueA );
		b.changeValue( valueB );
		this._changeTotal( total );

		a.context.addOtherAction( b.getId(), answer );

		if ( this.dealCallback ) {
			this.dealCallback( a, valueA, b, valueB, total );
		}

		if ( this.deathCallback ) {
			if ( a.isDead() ) {
				this.deathCallback( a );
			}
			if ( b.isDead() ) {
				this.deathCallback( b );
			}
		}

	}

});

