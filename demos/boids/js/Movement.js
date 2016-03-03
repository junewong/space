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
	this._validateRatio      = 0.7; //有效概率
	this.scope = [[-100, 100], [-100, 100], [-100, 100]]; 
};

Movement.prototype = {

	// 每一帧的运动
	run : function( movements ) {

		this.checkBounds();

		if (Math.random() > 0.3) {
			this.flock( movements );
		};

		this.move();
	},

	// 计算移动的位置
	move : function() {

		this.velocity.addToSelf( this._acceleration );

		var length = this.velocity.length();

		//  如果大于最大速度，需要减慢速度
		if (length > this._maxSpeed) {
			this.velocity.multiplyToSelf( this._maxSpeed / length );
		}

		this.position.addToSelf(this.velocity);

		if (this._debug && this.id == 0) {// debug
			//console.log("move - id:" + this.id +  " velocity: " + this.velocity.toString() + " acceleration: " + this._acceleration.toString() );
		};

		this._acceleration.init(0, 0, 0);
	},

	setScope : function (xRange, yRange, zRange) { // 3 Array

		this.scope = [xRange, yRange, zRange];
	}, 

	// 检查是否超出边界，超出则修正加速度进行转向
	checkBounds : function () {

		// 计算即将达到的位置；
		// 将速率变成纯向量，乘以可视范围的向量，再跟当前位置相加）
		var pureVector = this.velocity.pure();
		var furturePosition = this.position.add(pureVector.multiply(this.watchScope))
		var furtureArray = furturePosition.toArray();

		for (var i in this.scope) {

			var range = this.scope[i];

			var offsetDirection = furtureArray[i] < range[0] ? -1 
								: (furtureArray[i] > range[1] ? 1 
								: 0);

			if ( offsetDirection != 0  ) {
				/*
				// 简单的转向，即将xyz中要碰撞的值乘以-1
				var array = [1, 1, 1];
				array[i] = -1;
				return Vector.fromArray(array);
				*/
				
				// 遇到障碍物“墙”，采用简单的回避方法：
				// 先求折射之后的目标位置
				var array = [1, 1, 1];
				// 如果处于回避的方向的运动过程中，则不需要改变，否则需要转向
				array[i] = offsetDirection * pureVector.toArray[i] * -1;
				var reverseVector = Vector.fromArray(array);

				var v = furturePosition;
				v.multiplyToSelf( reverseVector );

				// 计算当前位置到目标位置的方向和速度
				v.subtractToSelf( this.position )

				// 计算加速度，控制其最大范围
				var length = v.length();

				if (length > this._maxSteerForce) {
					// 避免加速度过大，同时为了避免这种“反弹”的影响太大，这里暂时多乘以一个系数
					v.divideToSelf( length / this._maxSteerForce * 1.35);
				};

				// 加入加速度
				this._acceleration.addToSelf( v );


				if (this._debug && this.id == 0) {// debug
					console.log("checkBounds - id:" + this.id + ' velocity:' +  this.velocity.toArray() + " v pure: " + this.velocity.pure());///
					console.log("checkBounds - id:" + this.id +  " v: " + v.toString() + " acceleration: " + this._acceleration.toString() + ' in range[' + i + ']: ' + range + ' furtureArray: ' + furtureArray);
					//console.log("checkBounds - id:" + this.id + ' furtureArray: ' + furtureArray[i] + ' in range[' + i + ']: ' + range);
				};


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

	// 跟其他鸟的飞行方向保持大致一致
	alignment : function ( movements ) {

		var sumVector = new Vector();

		var movement, count = 0;

		for (var i in movements) {

			if ( Math.random() > this._validateRatio ) continue;

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

	// 向最近的几只鸟的平均位置靠拢
	cohesion : function ( movements ) {

		var sumPosition = new Vector();
		var v = new Vector();

		var movement, count = 0;

		for (var i in movements) {

			if ( Math.random() > this._validateRatio ) continue;

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

	// 跟附近其他几只鸟保持距离
	separation : function ( movements ) {

		var accelerationSum = new Vector();

		var movement;

		for (var i in movements) {

			if ( Math.random() > this._validateRatio ) continue;

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
