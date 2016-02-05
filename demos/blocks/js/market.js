var Market = function() {

	var INFO_HEIGHT = 30;

	var colors = [ 'red', 'orange', 'purple', 'green', 'blue' ];
	var amount = 100, price = amount;
	var goods = {
		'red'    : amount,
		'orange' : amount,
		'purple' : amount,
		'green'  : amount,
		'blue'   : amount,
	};

	var prices = {
		'red'    : price,
		'orange' : price,
		'purple' : price,
		'green'  : price,
		'blue'   : price,
	};

	function generate() {
		var color = colors[ Crafty.math.randomInt( 0, colors.length-1 ) ];
		var count = goods[ color ];
		if ( count <= 0 ) {
			return generate();
		}
		return color;
	}

	var delay = 100;

	var player1 = new Player( { id:1, isAI:false, autoLock:true, offsetX: 0, offsetY: INFO_HEIGHT, delay: delay, generate: generate, market:this } );
	var player2 = new Player( { id:2, isAI:true, offsetX: 320, offsetY: INFO_HEIGHT, delay: delay, generate: generate, market:this } );
	var player3 = new Player( { id:3, isAI:true, offsetX: 640, offsetY: INFO_HEIGHT, delay: delay, generate: generate, market:this } );

	var players = [ player1, player2, player3 ];
	 
	var current = 0, lastPlayer;
	function next() {
		if ( lastPlayer ) {
			lastPlayer.unhighlight();
			lastPlayer.lock();
		}

		var player = players[ current ];
		if ( player.isDead() ) {
			// 有人破产，游戏结束
			return;
		}

		player.highlight();
		player.unlock();

		if ( player.isAI() ) {
			player.next();
		}

		lastPlayer = player;

		if ( current == players.length -1 ) {
			updatePrice();
			showInfo();
		}

		current = (current + 1) >= players.length ? 0 : current + 1;
	}

	function getNextColor( color ) {
		var i = colors.indexOf( color );
		var nextItem = i >= colors.length -1 ? 0 : i + 1;
		var nextColor = colors[ nextItem ];
		return nextColor;
	}

	function updateAmount( data ) {
		goods[ data.color ] -= data.count;

		var nextColor = getNextColor( data.color );
		goods[ nextColor ] += ( data.score <= 2 ? 0 : data.score );
	}

	function updatePrice() {
		for ( var i in prices ) {
			prices[i] = price - ( goods[i] - amount );
		}
	}

	function descAmount() {
		var items = [];
		for ( var i in goods ) {
			items.push( i + ':' + goods[i] );
		}
		return '总量：' + items.join( '  ' );
	}

	function descPrices() {
		var items = [];
		for ( var i in prices ) {
			items.push( i + ':' + prices[i] );
		}
		return '价格：' + items.join( '  ' );
	}

	function showInfo() {
		//info.text( descPrices() + '   ' + descAmount() );
		info.text( descPrices() );
	}

	Crafty.bind( 'CleanDone', function( data ) {
		updateAmount( data );
		showInfo();
		next();
	});

	var info = Crafty.e( '2D,DOM,Text' )
			.attr( {x:0, y:0, w:800, h:INFO_HEIGHT} )
			.css( {"color": "black"} )
			//.css( {"background-color": 'gray'} )
			.css( {"padding-top": "2px", "padding-left": "2px"} )
			.css( {"fontSize": "18px", "fontWeight": "bold"} );



	this.getProfix = function( data ) {
		var cost = prices[ data.color ] * data.count;
		var nextColor = getNextColor( data.color );
		var earn = prices[ nextColor ] * ( data.score <= 2 ? 0 : data.score );
		return earn - cost;
	};

	showInfo();

	setTimeout( function() {
		next();
	}, 2000 );



};
