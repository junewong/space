var Class = function() {  
	var parent,
		methods,              
		klass = function() { 
			this.init.apply(this, arguments); 
			//copy the properties so that they can be called directly from the child
			//class without $super, i.e., this.name
			var reg = /\(([\s\S]*?)\)/;
			var params = reg.exec(this.init.toString());
			if (params) {
				var param_names = params[1].split(',');
				for ( var i=0; i<param_names.length; i++ ) {
					this[param_names[i]] = arguments[i];
				}
			}
		},
		extend = function(destination, source) {   
			for (var property in source) {
				destination[property] = source[property];
			}
			//IE 8 Bug: Native Object methods are only accessible directly
			//and do not come up in for loops. ("DontEnum Bug")
			if (!Object.getOwnPropertyNames) {
				var objMethods = [
					'toString' ,'valueOf' ,'toLocaleString' ,'isPrototypeOf' ,'propertyIsEnumerable' ,'hasOwnProperty'
					];

				for(var i=0; i<objMethods.length; i++) {
					// if (  isNative(source,objMethods[i])
					if (typeof source[objMethods[i]] === 'function' && 
							source[objMethods[i]].toString().indexOf('[native code]') == -1) {
								//document.writeln('copying ' + objMethods[i]+'<br>');
								console.log('copying ' + objMethods[i]+'<br>');
								destination[objMethods[i]] = source[objMethods[i]];
							}
				}
			}

			destination.$super =  function(method) {
				return this.$parent[method].apply(this.$parent, Array.prototype.slice.call(arguments, 1));
			};
			return destination;  
		};

	if (typeof arguments[0] === 'function') {       
		parent  = arguments[0];       
		methods = arguments[1];     
	} else {       
		methods = arguments[0];     
	}     

	if (parent !== undefined) {       
		extend(klass.prototype, parent.prototype);       
		klass.prototype.$parent = parent.prototype;
	}
	extend(klass.prototype, methods);  
	klass.prototype.constructor = klass;      

	if (!klass.prototype.init) klass.prototype.init = function(){};         

	return klass;   
};



function D( id ) {
	return document.getElementById( id );
}

function C( nodeName, id ) {
	var node = document.createElement( nodeName );
	if ( id !== undefined ) {
		node.id = id;
	}
	return node;
}

function L( log ) {
	console.log ( log );
}

function W( log, tag  ) {
	if ( log ) {
		var html = ! tag ? log : '<' + tag + '>' + log + '</' + tag + '>';
		window.document.write( html );
	}
	window.document.write( '<br/>' );
}

function randomNumber( from, to ) {
	Random.getInt( from, to );
}

var Random = {
	getInt : function( from, to ) {
		if ( to === undefined ) {
			to = from;
			from = 0;
		}
		var length = to - from;
		var rand = parseInt( Math.random() * 100 % length );
		return from + rand;
	},

	// 将一个数值拆分成一个数组，总和为这个数
	splitNumber : function( total, count ) {
		var result = [];
		var left = total;
		for ( var i = 1; i <= count; i++ ) {
			// 最后的一个数字 
			if ( i == count ) {
				result.push( left );

			// 如果已经没数可分配
			} else if ( left === 0 ) {
				result.push( 0 );

			// 随机分配
			} else {
				var r = this.getInt( 0, left );
				result.push( r );
				left -= r;
			}
		}
		return result;
	},

	uniqueNumber : function( length ) {
		var indexs = Arrays.createIndexArray( length );
		return indexs.shuffle();
	},

	one : function( list ) {
		if ( ! list || list.length <= 0 ) {
			return null;
		}
		var i = this.getInt( list.length - 1 );
		return list[ i ];
	},

	some : function( list, count ) {
		var indexs = this.uniqueNumber( list.length );
		return indexs.slice( 0, count ).mapNew( function( index, i ) {
			return list[ index ];
		});
	}
};


var Arrays = {
	// 重复调用几次
	repeat : function( count, callback ) {
		for ( var i = 0; i < count; i++) {
			callback( i );
		}
	},

	// 创建一个count个数的数组
	create : function( count, callback ) {
		var list = [];
		for ( var i = 0; i < count; i++) {
			var r = callback( i );
			if ( r ) {
				list.push( r );
			}
		}
		return list;
	},

	createIndexArray : function( count ) {
		var list = [];
		for ( var i = 0; i < count; i++) {
			list.push( i );
		}
		return list;
	},

	mapBoth : function( a, b, callback ) {
		if ( ! a || ! b || a.length != b.length ) {
			throw new Exception( 'both array length not equal!' );
		}
		for ( var i = 0, len = a.length; i < len; i++ ) {
			callback( a[i], b[i], i );
		}
	},

	range : function( from, to ) {
		var list = [];
		for (var i = from; i <= to; i ++ ) {
			list.push( i );
		}
		return list;
	},

	copy : function( array ) {
		var list = [];
		for (var i = 0; i < array.length; i ++ ) {
			list.push( array[i] );
		}
		return list;
	},

	copyToArray: function( item, count ) {
		var list = [];
		for ( var i = 0; i < count; i++) {
			list.push( item );
		}
		return list;
	}

};

// 遍历数组
Array.prototype.map = function( callback ) {
	for ( var i = 0, len = this.length; i < len; i++ ) {
		callback( this[i], i );
	}
};

// 遍历并返回新数组
Array.prototype.mapNew = function( callback ) {
	var list = [];
	for ( var i = 0, len = this.length; i < len; i++ ) {
		var r = callback( this[i], i );
		if ( r ) {
			list.push( r );
		}
	}
	return list;
};

// 统计出现的key的次数
Array.prototype.countKeys = function( callback ) {
	var result = {};
	for ( var i = 0, len = this.length; i < len; i++ ) {
		var k = callback( this[i], i );
		if ( k !== null || k !== undefined) {
			var count =  result[ k ];
			result[ k ] = count !== undefined ? count + 1 : 0;
		}
	}
	return result;
};

Array.prototype.addArray = function( array ) {
	for ( var i = 0, len = array.length; i < len; i++ ) {
		this.push( array[i] );
	}
	return this;
};

Array.prototype.shuffle = function() {
	this.sort( function( a, b ){ 
		return Math.floor(Math.random() * 3) - 1; 
	});
	return this;
};

Array.prototype.findFirst = function( callback ) {
	for ( var i = 0, len = this.length; i < len; i++ ) {
		var item = this[i];
		if ( callback( item, i ) ) {
			return item;
		}
	}
	return null;
};

Array.prototype.allMatch = function( callback ) {
	for ( var i = 0, len = this.length; i < len; i++ ) {
		var item = this[i];
		if ( false === callback( item, i ) ) {
			return false;
		}
	}
	return true;
};

Array.prototype.addUniq = function( value ) {
	if ( false === ( value in this ) ) {
		this.push( value );
	}
	return this;
};

Array.prototype.getValues = function( indexs ) {
	var list = [];
	for ( var i = 0, len = indexs.length; i < len; i++ ) {
		var value = this[ indexs[i] ];
		if ( value !== undefined ) {
			list.push( value );
		}
	}
	return list;
};

Array.prototype.randomOne = function() {
	return Random.one( this );
};

Array.prototype.randomSome = function( count ) {
	return Random.some( this, count );
};


Array.prototype.contains = function( item ) {
	for ( var i = 0, len = this.length; i < len; i++ ) {
		if ( item == this[i] ) {
			return true;
		}
	}
	return false;
};


// e.g.: 
// 	"{0} is dead, but {1} is alive! {0} {2}".format("ASP", "ASP.NET")
String.prototype.format = function() {
	var args = arguments;
	return this.replace(/\$(\d+)/g, function(match, number) { 
		return typeof args[number] != 'undefined' ? args[number] : match ;
	});
};

Number.prototype.fixedIn = function( from, to ) {
	var v = this;
	v = Math.max( v, from );
	v = Math.min( v, to );
	return v;
};

Object.prototype.getByKeys = function( keys ) {
	var _this = this;
	return keys.mapNew( function( key, i ) {
		return _this[ key ];

	});
};

Object.prototype.wrap = function( left, right ) {
	return left + this + ( right || '' );
};


function hasClass(ele,cls) {
	return !!ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}

function addClass(ele,cls) {
	if (!hasClass(ele,cls)) ele.className += " "+cls;
}

function removeClass(ele,cls) {
	if (hasClass(ele,cls)) {
		var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
		ele.className=ele.className.replace(reg,' ');
	}
}
