$(function() {

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

});
