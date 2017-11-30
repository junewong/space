var UserInfoComponet = {

	start : function() {
		this.init();
		this._checkSubmitButton();
	},

	init : function() {
		this._initEvents();
		this._initTabs();
		this._initValidation();
	},

	_initEvents : function() {
		var _this = this;

		$('input[type=text]').off('keyup').on( 'keyup', this._checkSubmitButton );
		$('input[type=date]').off('change').on( 'change', this._checkSubmitButton );
		$('select').off('change').on( 'change', this._checkSubmitButton );
		$('#accpet').off('click').on( 'click', this._checkSubmitButton );
		$('body').off('click').on('click', function() {
			$('.unhappyMessage').remove();
		});

		// 安卓使用自定义日期插件，而iOS保留日期控件
		if ( ! Browser.isIOS() ) {
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
	},

	_initValidation : function() {
		$('.unhappyMessage').remove();

		function minLength(val, min) {
			return val.length < min ? new Error('至少要' + min + '个字符') : true;
		}

		function maxLength(val, max) {
			return val.length > max ? new Error('最多不超过' + max + '个字符') : true;
		}

		var checkUserBirthTimeRule = {
			required: true,
			message: '请输入正确的日期',
			test: function(value) {
				var birthday = new Date(value);
				var birthdayInt = birthday.getTime();

				if (isNaN(birthdayInt)) {
					// uses the default message.
					return false;
				}
				if(birthdayInt > new Date()) {
					return new Error('日期不能超过今天');
				}
				return true;
			}
		};

		var checkChildBirthTimeRule = {
			required: true,
			message: '请选择正确的日期',
			test: function(value) {
				var birthday = new Date(value);
				var birthdayInt = birthday.getTime();

				if (isNaN(birthdayInt)) {
					// uses the default message.
					return new Error('日期不能为空');
				}
				if(birthdayInt > new Date()) {
					return new Error('日期不能超过今天');
				}
				// 最大不能超过12岁
				var maxAge = 12;
				var year = new Date().getFullYear();
				var minYear = year - maxAge;
				var minDate = new Date( minYear + '/01/01' );
				if ( birthdayInt < minDate.getTime() ) {
					return new Error( '目前仅支持0-' + maxAge + '岁的小孩' );
				}
				return true;
			}
		};

		function checkPregnancyTimeRule( arg ) {
			return {
				required: 'sometimes',
				message: '请选择正确的日期',
				arg: arg,
				when: 'unknow', // 取消即时检测
				test: function(value, arg) {
					var $date = $(arg);

					var inputDate = new Date(value).getTime();
					var min = new Date( $date.attr('min') ).getTime();
					var max = new Date( $date.attr('max') ).getTime();

					if (isNaN(inputDate)) {
						return new Error( '日期不能为空' );
					}

					if ( inputDate < min || inputDate > max ) {
						return new Error(  '日期超过可能的预产期' );
					}
					return true;
				}
			};
		}

		var checkNameRule = {
			required: true,
			message: '请填写昵称',
			test: [minLength, maxLength],
			arg: [1, 64]
		};

		var familyRoleRule = {
			required: true,
			message: '请选择家庭你的家庭角色'
		};

		var genderRule = {
			required: true,
			message: '请选择性别'
		};

		var checkAccept = {
			required: true,
			message: '请同意服务条款'
		};

		var rules = {};
		var period = $( 'input[name=period]:checked' ).val();
		var isExpectedDate = !!! $( '#expectedDateTip' ).prop( 'checked' );

		if ( period == 1 ) {
			rules = {
				'#nickName'     : checkNameRule,
				'#userBirthday' : checkUserBirthTimeRule,
				'#familyRole1'  : familyRoleRule
			};

		} else if ( period == 2 ) {
			if ( isExpectedDate ) {
				rules = {
					'#expectedDateIntput'   : checkPregnancyTimeRule( '#expectedDateIntput' ),
					'#familyRole2'       	: familyRoleRule
				};
			} else {
				rules = {
					'#lastMenstruationInput' : checkPregnancyTimeRule( '#lastMenstruationInput' ),
					'#familyRole2'       	 : familyRoleRule
				};
			}

		} else if ( period == 3 ) {
			rules = {
				'#name'       : checkNameRule,
				'#birthday'   : checkChildBirthTimeRule,
				'#gender'     : genderRule,
				'#familyRole3' : familyRoleRule
			};
		}

		// 服务条款
		rules[ '#accpet' ] =  checkAccept;

		// 表单校验
		$('#userInfoForm').isHappy({
			submitButton: '#submitButton',
			fields: rules
		});
	},

	_initTabs : function() {
		var _this = this;
		function callback( tab, obj, shown ) {
			// 没有显示的区域内的输入项都不提交
			$(tab).find('input,select').prop( 'disabled', ! shown );
			if ( shown ) {
				setTimeout(function() {
					_this._initEvents();
					_this._initValidation();
					_this._checkSubmitButton();
				}, 10 );
			}
		}

		UIToolbox.tabGroup( $('.period-option input[type=radio]'), callback );
		UIToolbox.tabGroup( $('#expectedDateTip,#menstruationTip'), callback );
	},

	_checkSubmitButton: function() {
		var enable = true;
		$('#userInfoForm').find('input,select,#accpet').not('[name=period]').filter(function() {
			return !!! $(this).prop( 'disabled' );
		}).each( function() {
			if ( ! UIToolbox.isVisibility( this ) ) {
				return;
			}
			var value =  $(this).is('input[type=checkbox]') ? $(this).prop('checked') : !! $(this).val();
			enable &= value;
		});

		$('#submitButton').prop( 'disabled', enable ? '' : 'disabled' );
	}
};

$(function() {
	// start:
	UserInfoComponet.start();
});
