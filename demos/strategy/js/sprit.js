
var Sprit = Class({

	init : function( strategy, color ) {
		this.strategy = strategy;
		this.color = color || '';
		this.node = null;
		this.scoreNode = null;
		this.clickCallback = null;
	},

	getNode : function() {
		if ( ! this.node ) {
			this.node = this.createNode();
		}

		return this.node;
	},

	createNode : function() {
		var _this = this;

		var node = document.createElement( 'div' );
		node.className = 'strategy';
		node.style.backgroundColor = this.color;
		node.title = this.strategy.description;
		node.onclick = function( e ) {
			if ( _this.clickCallback ) {
				_this.clickCallback( e );
			}
		};

		var div = document.createElement( 'div' );
		div.className = 'score';
		div.innerHTML = this.strategy.getValue();
		this.scoreNode = div;
		node.appendChild( div );

		var div = document.createElement( 'name' );
		div.className = 'name';
		div.innerHTML = this.strategy.getName();
		node.appendChild( div );

		return node;
	},

	onClick : function( callback ) {
		this.clickCallback = callback;
	},

	setScore : function( score ) {
		this.scoreNode.innerHTML = score;
	}

});
