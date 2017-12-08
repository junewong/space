var DateUtil = {
	formatDateTime : function( date ) {
		var dateString = this.formatDate( date ) + " " + this.formatTime( date );
		return dateString;
	},

	formatDate : function( date ) {
		var dateString =  date.getFullYear() +
			"-" + ("0"+(date.getMonth()+1)).slice(-2) +
			"-" + ("0" + date.getDate()).slice(-2);
		return dateString;
	},

	formatDateCH : function( date ) {
		var dateString =  date.getFullYear() +
			"年" + ("0"+(date.getMonth()+1)).slice(-2) +
			"月" + ("0" + date.getDate()).slice(-2) + '日';
		return dateString;
	},

	formatTime : function( date ) {
		var datestring = ("0" + date.getHours()).slice(-2) + ":" +
						 ("0" + date.getMinutes()).slice(-2) + ":" +
						 ("0" + date.getSeconds()).slice(-2);
		return datestring;
	},

	splitDate : function( date ) {
		return { 
			year  : date.getFullYear(),
			month : date.getMonth() + 1,
			day   : date.getDate()
		};
	}
};

$(function() {

	// 获取干支年的天数 
	function getGz( date ) {
		var d = DateUtil.splitDate( date );
		var gz = G.date.toGz( d.year, d.month, d.day );
		return gz;
	}

	function getGzDay( date ) {
		var gz = getGz( date );
		var gd = gz.gd;
		return gd;
	}

	function getLunarObject( date ) {
		var gd = getGzDay( date );
		return LunarMap[ gd ];
	}

	function showLunar( lunar ) {
		$('.point').html( lunar.point );
		$('.phase').html( lunar.phase );
		$('.channel').html( lunar.channel );
	}

	// Date
	function initDate() {
		$('input[type=date]').each( function() {
			var key = 'init-datepicker';
			var flag = $(this).data( key );
			if ( flag ) return;

			var _date = this;
			var datePicker = new DatePicker({
				target     : _date,
				currDate   : _date.value ? new Date( _date.value ) : new Date(),
				confirmCbk : function(data) {
					var year = data.year;
					var day = data.day;
					var month = data.month;
					if ( month === 0 ) {
						month = 12;
						year--;
					}
					var value = year + '-' + month + '-' + day;
					value = value.replace( /-(\d\b)/g, '-0$1' );
					_date.value = value;
					_this._checkSubmitButton();
				}
			});
			_date.onfocus = function(e) {
				_date.blur();
				datePicker.open();
			};

			$(this).data( key, true );
		});
	}

	function reload() {
		var date = $('#date').val();
		var time = $('#time').val() || 0;
		if ( ! date ) return;

		var gz = getGz( new Date(date) );
		var descDate = gz.gy + '年' + ' ' + gz.gm + '月' + ' ' + gz.gd + '日';
		$('#dateDesc').html( descDate );

		var lunar = getLunarObject( new Date(date) );
		showLunar( lunar );
	}

	// init date time
	$('#date').val( DateUtil.formatDate( new Date() ) );
	$('#time').val( DateUtil.formatTime( new Date() ) );

	// event
	$('#submitButton').on( 'click', reload );

	reload();

});
