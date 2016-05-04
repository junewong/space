var Util = {

	randomnRangeNumber : function (from, to) {

		return (to - from) * Math.random() + from;
	},

	randomVector : function (from, to) {

		var v = new Vector();

		v.x = this.randomnRangeNumber(from, to);
		v.y = this.randomnRangeNumber(from, to);
		v.z = this.randomnRangeNumber(from, to);

		return v;
	}, 

	vectorToString : function (v) {
		return v.x + ' ' + v.y + ' ' + v.z;
	}
};
