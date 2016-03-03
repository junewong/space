var Movement = function() {

	this._debug              = false;
	this.id                  = 0;
	this.position            = new Vector();
	this.velocity            = new Vector();
	this._acceleration       = new Vector();
	this.watchScope          = new Vector(4, 4, 4);
	this._maxSpeed           = 4;
	this._neighborhoodRadius = 50;
	this._maxSteerForce      = 0.1;
	this.scope = [[-100, 100], [-100, 100], [-100, 100]]; 
};

Movement.prototype = {

	run : function( movements ) {

		var changeVecotor = this.checkBounds();
		if (changeVecotor != false) {

			// 以折射的方式转向
			this.velocity.multiplyToSelf( changeVecotor );
		}

		if (Math.random() > 0.3) {
			this.flock( movements );
		};

		this.move();
	},

	move : function() {

		this.velocity.addToSelf( this._acceleration );

		var length = this.velocity.length();

		//  如果大于最大速度，需要减慢速度
		if (length > this._maxSpeed) {
			this.velocity.multiplyToSelf( this._maxSpeed / length );
		}

		this.position.addToSelf(this.velocity);

		if (this._debug && this.id == 0) {// debug
			console.log("move - id:" + this.id +  " velocity: " + this.velocity.toString() + " acceleration: " + this._acceleration.toString() );
		};

		this._acceleration.init(0, 0, 0);
	},

	setScope : function (xRange, yRange, zRange) { // 3 Array

		this.scope = [xRange, yRange, zRange];
	}, 

	// 检查是否超出边界，否则返回转向的纯向量
	checkBounds : function () {

		// 计算即将达到的位置；
		// 将速率变成纯向量，乘以可视范围的向量，再跟当前位置相加）
		var furturePosition = this.position.add(this.velocity.pure().multiply(this.watchScope)).toArray();

		for (var i in this.scope) {
			var range = this.scope[i];
			// 简单的转向，即将xyz中要碰撞的值乘以-1
			if (furturePosition[i] < range[0] || furturePosition[i] > range[1] ) {
				var array = [1, 1, 1];
				array[i] = -1;
				return Vector.fromArray(array);
			}
		}

		return true;
	}, 

	// 调用三大原则，决定移动的加速度
	flock : function ( movements ) {

		this._acceleration.addToSelf( this.alignment( movements ) );
		this._acceleration.addToSelf( this.cohesion( movements ) );
		this._acceleration.addToSelf( this.separation( movements ) );
	},

	alignment : function ( movements ) {

		var sumVector = new Vector();

		var movement, count = 0;

		for (var i in movements) {

			movement = movements[i];

			if ( movement == this ) continue;

			var distance = movement.position.distanceTo( this.position );

			if ( distance > 0 && distance <= this._neighborhoodRadius ) {

				sumVector.addToSelf( movement.velocity );

				count ++;
			};
		}

		if (count > 0) {

			sumVector.divideToSelf( count );

			var length = sumVector.length();

			if (length > this._maxSteerForce) {
				sumVector.divideToSelf( length / this._maxSteerForce);
			};

		};

		if (this._debug && this.id == 0) {///
			//console.log("alignment - id:" + this.id +  " count: " + count + " vector: " + sumVector.toString() );///
		};///

		return sumVector;
	},

	cohesion : function ( movements ) {

		var sumPosition = new Vector();
		var v = new Vector();

		var movement, count = 0;

		for (var i in movements) {

			movement = movements[i];

			if ( movement == this ) continue;

			var distance = movement.position.distanceTo( this.position );

			if ( distance > 0 && distance <= this._neighborhoodRadius ) {

				sumPosition.addToSelf( movement.position );

				count ++;
			};
		}

		if (count > 0) {
			sumPosition.divideToSelf( count );
		};

		v.subtractToSelf( sumPosition ).subtractToSelf( this.position );

		var length = v.length();

		if (length > this._maxSteerForce) {
			v.divideToSelf( length / this._maxSteerForce);
		};


		return v;
	},

	separation : function ( movements ) {

		var accelerationSum = new Vector();

		var movement;

		for (var i in movements) {

			movement = movements[i];

			if ( movement == this ) continue;

			var distance = movement.position.distanceTo( this.position );

			if ( distance > 0 && distance <= this._neighborhoodRadius ) {

				accelerationSum.subtractToSelf( movement.position ).subtractToSelf( this.position );

				accelerationSum.normalize();

				accelerationSum.divideToSelf( distance );

			};
		}

		return accelerationSum;
	},

	_findMinPositionValue : function() {

		var min = 9999999; //TOOD max number

		var props = [ 'x', 'y', 'z' ];

		for ( var key in props ) {

			var value = Math.abs( this.velocity[ props[key] ] );

			if ( value >= this._maxSpeed ) {
				return value / this._maxSpeed;
			}

			if ( value > 0 && value < 1 )  {
				min = Math.min( value, min );
			}
		}

		return min == 9999999 ? 0 : min;
	}
};
