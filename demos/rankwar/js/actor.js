
var Actor = Class({

	init : function( name, skillGroup, context ) {
		this.id = null;
		this.name = name;
		this.node = null;
		this.statusNode = null;
		this.clickCallback = null;
		this.skillGroup = skillGroup;
		this.context = context;
		this.isManual = false;
		this.strategy = null;
	},

	setId : function( id ) {
		this.id = id;
	},

	getId : function() {
		return this.id;
	},

	getName : function() {
		return this.name;
	},

	setStrategy : function( strategy ) {
		this.strategy = strategy;
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
		node.className = this.isManual ? 'actor manual' : 'actor';
		node.title = this.strategy.description;
		node.onclick = function( e ) {
			if ( _this.clickCallback ) {
				_this.clickCallback( e );
			}
		};

		var div = document.createElement( 'div' );
		div.className = 'name';
		div.innerHTML = this.getName();
		node.appendChild( div );

		div = document.createElement( 'div' );
		div.className = 'status';
		div.innerHTML = this.context.getDescription();
		this.statusNode = div;
		node.appendChild( div );

		return node;
	},

	onClick : function( callback ) {
		this.clickCallback = callback;
	},

	setStatus : function( text ) {
		this.statusNode.innerHTML = text;
	},

	updateStatus : function() {
		var text = this.context.getDescription();
		this.statusNode.innerHTML = text;
	},

	setFighting : function( isFighting ) {
		if ( isFighting ) {
			addClass( this.getNode(), 'fight' );
		} else {
			removeClass( this.getNode(), 'fight' );
		}
	}

});
