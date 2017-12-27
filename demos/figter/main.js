'use stick';

var TYPE_ATTACK = 'Attack';
var TYPE_DEFENSE =  'Defense';
var TYPE_MOVE =  'Move';

var MAX_LIFE = 10;

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function log( str ) {
	console.log( str );
}

function actor( name, cards ) {
	return {
		life : MAX_LIFE,
		name, cards,
		action : function() {
			shuffle( this.cards );
			return this.cards.shift();
		},
		showCards : function() {
			var list = [];
			list.push( this.action() );
			list.push( this.action() );
			list.push( this.action() );
			return list;
		},
		isEnd : function() {
			return this.cards.length == 0;
		}
	};
}

function card( type, value ) {
	return {type, value};
}

function cardlist(config) {
	let list = [];
	config = config && config.length > 0 ? config : [15, 3, 7, 5 ];
	for ( var i = 0; i < config[0]; i ++ ) {
		list.push( card( TYPE_ATTACK, 1 ) );
	}
	for ( var i = 0; i < config[1]; i ++ ) {
		list.push( card( TYPE_ATTACK, 2 ) );
	}
	for ( var i = 0; i < config[2]; i ++ ) {
		list.push( card( TYPE_DEFENSE, 1 ) );
	}
	for ( var i = 0; i < config[3]; i ++ ) {
		list.push( card( TYPE_DEFENSE, 2 ) );
	}
	/*
	for ( var i = 0; i < 5; i ++ ) {
		list.push( card( TYPE_MOVE, 1 ) );
	}
	*/
	return list;
}

function judge( actor1, actions1, actor2, actions2 ) {
	var size = actions1.length;
	for ( var i = 0; i < size; i++ ) {
		var a1 = actions1[i];
		var a2 = actions2[i];
		if ( a1.type == TYPE_ATTACK && a2.type == TYPE_ATTACK ) {
			actor1.life -= a2.value;
			actor2.life -= a1.value;
		}
		else if ( a1.type == TYPE_DEFENSE && a2.type == TYPE_DEFENSE ) {
		}
		else if ( a1.type == TYPE_ATTACK && a2.type == TYPE_DEFENSE ) {
			var value = ( a1.value - a2.value );
			//log( value );
			if ( value < 0 ) {
				actor2.life -= value;
			} else {
				actor1.life -= value;
			}
			//log ( `${actor2.name} life: ${actor2.life}`);
		}
		else if ( a1.type == TYPE_DEFENSE && a2.type == TYPE_ATTACK ) {
			var value = ( a2.value - a1.value );
			//log ( value );
			if ( value < 0 ) {
				actor1.life -= value;
			} else {
				actor2.life -= value;
			}
			//log ( `${actor1.name} life: ${actor1.life}`);
		}
		if ( actor1.life > MAX_LIFE ) {
			actor1.life = MAX_LIFE;
		}
		if ( actor2.life > MAX_LIFE ) {
			actor2.life = MAX_LIFE;
		}
	}
}

function actions2str( actions ){
	return JSON.stringify( actions ).replace( /"/g, '' );
}

function isGameOver( actor1, actor2 ) {
	let count = 0;
	let name = '';
	if ( actor1.life <= 0 ) {
		count++;
		name = actor2.name;
	}
	if ( actor2.life <= 0 ) {
		count++;
		name = actor1.name;
	}
	if ( count == 1 ) {
		log( `=========== ${name} Win! =========` );
		return true;
	}
	if ( count == 2 ) {
		log( `=========== ALL Win! =========` );
		return true;
	}
	if ( count == 0 && actor1.isEnd() && actor2.isEnd() ) {
		log( `=========== Nobody Win =========` );
		return true;
	}
	return false;
}


function figter( actor1, actor2 ) {
	log( `------------- ${actor1.name} VS ${actor2.name} --------------` );
	let index = 1;
	while( ! actor1.isEnd() && ! actor2.isEnd() ) {
		let actions1 = actor1.showCards();
		let actions2 = actor2.showCards();
		log( `======== ${index} =========` );
		judge( actor1, actions1, actor2, actions2 );
		log ( `${actor1.name} action: ` + actions2str( actions1 ) );
		log ( `${actor2.name} action: ` + actions2str( actions2 ));
		log ( `${actor1.name} life: ${actor1.life}`);
		log ( `${actor2.name} life: ${actor2.life}`);

		if ( isGameOver( actor1, actor2 ) ) {
			break;
		}
		index++;
	}
}

let actorList = [];
actorList.push( actor( 'ChengMou'   , cardlist( [15, 4, 7, 5 ] ) ) );
actorList.push( actor( 'Wangjian'   , cardlist( [16, 2, 0, 10 ] ) ) );
actorList.push( actor( 'King'       , cardlist( [10, 5, 0, 10 ] ) ) );
actorList.push( actor( 'Kaven'      , cardlist( [12, 8, 12, 4 ] ) ) );
actorList.push( actor( 'Jhon Keeper', cardlist( [10, 5, 10, 5 ] ) ) );
actorList.push( actor( 'Mary Jet'   , cardlist( [15, 7, 9, 2 ] ) ) );
actorList.push( actor( 'EightShen'  , cardlist( [20, 10, 0, 0 ] ) ) );
actorList.push( actor( 'Mantain'    , cardlist( [9, 10, 7, 2 ] ) ) );
actorList.push( actor( 'Carots'     , cardlist( [8, 2, 12, 8 ] ) ) );
actorList.push( actor( 'Caocao'     , cardlist( [20, 5, 8, 1 ] ) ) );

shuffle( actorList )

let actor1 = actorList[0];
let actor2 = actorList[1];

figter( actor1, actor2 );
