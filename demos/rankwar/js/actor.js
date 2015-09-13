
var Actor = Class({

	init : function( name, skillGroup, context ) {
		this.id = null;
		this.name = name;
		this.totalLife = 12;
		this.life = this.totalLife;

		this.node = null;
		this.statusNode = null;
		this.lifeBar = null;
		this.countryBar = null;

		this.skillGroup = skillGroup;
		this.context = context;
		this.strategy = null;

		this.isManual = false;
		this.death = false;

		this.clickCallback = null;

		this.shouldShowLifeBar = false;
		this.shouldShowCountryBar = false;

		this.country = '';
		this.countryColor = '';

		this.isGhostKiller = false;
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

	die : function() {
		this.death = true;
		addClass( this.getNode(), 'death' );
	},

	isDeath : function() {
		return this.death;
	},

	initLife : function( life ) {
		this.totalLife = life;
		this.life = life;
	},

	setLife : function( life ) {
		this.life = life;
	},

	getLife  : function() {
		return this.life;
	},

	getTotalLife  : function() {
		return this.totalLife;
	},

	changeLife : function( offset ) {
		this.life += offset;
		if ( this.life <= 0 ) {
			this.life = 0;
			this.die();
		}
		var percent = this.life / this.totalLife;
		this.setLifeBarPercent( percent );
	},

	setStrategy : function( strategy ) {
		this.strategy = strategy;
		this.strategy.setContext( this.context );
	},

	setCountry : function( country ) {
		this.country = country;
		this.shouldShowCountryBar = !!country;
	},

	setCountryColor : function( countryColor ) {
		this.countryColor = countryColor;
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
		node.title = this.strategy.getName() + '：' + this.strategy.description + '；';
		node.onclick = function( e ) {
			if ( _this.clickCallback ) {
				_this.clickCallback( e );
			}
		};

		var div;
		div = document.createElement( 'div' );
		div.className = 'life-bar';
		this.lifeBar = div;
		this.showLifeBar( this.shouldShowLifeBar );
		this.node = node;
		node.appendChild( div );

		div = document.createElement( 'div' );
		div.className = 'name';
		div.innerHTML = this.getName();
		node.appendChild( div );

		div = document.createElement( 'div' );
		div.className = 'status';
		div.innerHTML = this.context.getDescription();
		this.statusNode = div;
		node.appendChild( div );

		div = document.createElement( 'div' );
		div.className = 'country-bar';
		this.countryBar = div;
		this.showCountryBar( this.shouldShowCountryBar );
		node.appendChild( div );

		this.setGhostKiller( this.isGhostKiller );
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
	},

	setLifeBarPercent : function( percent ) {
		this.lifeBar.style.width = percent * 100 + '%';
	},

	showLifeBar : function( shown ) {
		this.shouldShowLifeBar = shown;
		if ( this.lifeBar ) {
			this.lifeBar.style.display = shown ? '' : 'none';
		}
	},

	showCountryBar : function( shown ) {
		this.shouldShowCountryBar = shown;
		if ( this.countryBar ) {
			this.countryBar.style.display = shown ? '' : 'none';
			this.countryBar.style.backgroundColor = this.countryColor;
		}
	},

	setGhostKiller : function( isGhostKiller ) {
		this.isGhostKiller = isGhostKiller;
		if ( this.node ) {
			if ( isGhostKiller ) {
				addClass( this.node, 'ghost-killer' );
			} else {
				removeClass( this.node, 'ghost-killer' );
			}
		} 
	}
	
});
