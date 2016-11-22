angular.module( 'shopnow.services', [] )

.factory('APIQ', function($resource, CONFIG) {
  return function(options) {
    return $resource(CONFIG.api.url + '/v1/api' + options.endpoint, {}, {
      get: { method: 'GET', isArray: false },
      update: { method: 'PUT'},
      save: { method: 'POST'},
      remove: { method: 'DELETE'},
      query: { method: 'GET', isArray: false, cancellable: true }
    });
  };
})

.service('PtrService', ['$rootScope', '$timeout', '$ionicScrollDelegate', function($rootScope, $timeout, $ionicScrollDelegate) {

  /**
   * Trigger the pull-to-refresh on a specific scroll view delegate handle.
   * @param {string} delegateHandle - The `delegate-handle` assigned to the `ion-content` in the view.
   */
  this.triggerPtr = function(delegateHandle) {

    $timeout(function() {
      $rootScope.$broadcast(delegateHandle + '-started');

      var scrollView = $ionicScrollDelegate.$getByHandle(delegateHandle).getScrollView();

      if (!scrollView) return;

      if(scrollView.__publish) {
        scrollView.__publish(
          scrollView.__scrollLeft, -scrollView.__refreshHeight,
          scrollView.__zoomLevel, true);
      }

      var d = new Date();

      scrollView.refreshStartTime = d.getTime();

      scrollView.__refreshActive = true;
      scrollView.__refreshHidden = false;
      if (scrollView.__refreshShow) {
        scrollView.__refreshShow();
        $rootScope.$broadcast(delegateHandle + '-auto');
      }
      if (scrollView.__refreshActivate) {
        scrollView.__refreshActivate();
      }
      if (scrollView.__refreshStart) {
        scrollView.__refreshStart();
      }

    });

  }
}])

.service('MainService', ['$rootScope', '$ionicLoading', '$ionicModal', '$ionicPopup', '$cordovaSocialSharing', '$ionicActionSheet', 'API', 'UI', function($rootScope, $ionicLoading, $ionicModal, $ionicPopup, $cordovaSocialSharing, $ionicActionSheet, API, UI) {
	var exports = {};
	
	var $scope = $scope || $rootScope.$new();

	$scope.refreshPermissions = function() {
		API.User.refreshPermissions(function() {
			$scope.doRefresh();
		});
	};

	$scope.closeModal = function() {
		$scope.modal.hide();
	};
      
	exports.shareNativeApp = function() {
		if(window.cordova) {
			$cordovaSocialSharing
				.share('', '', '', 'https://shopnowapp.com') // Share via native share sheet
				.then(function(result) {
					// console.log('$cordovaSocialSharing result', result);
				}, function(err) {
					// console.log('$cordovaSocialSharing error', err);
				});
		}
	}

	exports.shareNativePage = function(page) {
		if(window.cordova) {
			$cordovaSocialSharing
				.share('', '', '', 'https://shopnowapp.com/add/' + page.username) // Share via native share sheet
				.then(function(result) {
				}, function(err) {
				});
		}
	}

	exports.showFriends = function(options) {
		if(options.scope) {
			$scope = options.scope;
		}
		API.User.friends().then(function(friends) {
			$scope.share = function() {
				exports.shareNativeApp();
			}
			
			$scope.closeModal = function() {
				$scope.modal.hide();
			};
						
			$scope.onClick = function() {
			};

			$scope.options = options;
			if($scope.options.onClick) {
				$scope.onClick = $scope.options.onClick;
			}
			$scope.friends = friends.data;
			$scope.$broadcast('ptr-done');
			$scope.isLoading = false;
			$scope.showAction = false;
			$ionicModal.fromTemplateUrl('templates/modal.friends.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function(modal) {
				$scope.modal = modal;
				$scope.modal.show();
			});
		}).catch(function() {
			$scope.$broadcast('ptr-done');
			$scope.isLoading = false;
		});
	};		
	return ( exports );
}])

.service('PageHeaderService', ['$rootScope', '$ionicLoading', '$ionicModal', '$ionicPopup', '$cordovaSocialSharing', '$ionicActionSheet', 'API', 'UI', 'MainService', function($rootScope, $ionicLoading, $ionicModal, $ionicPopup, $cordovaSocialSharing, $ionicActionSheet, API, UI, MainService) {
	var hideSheet;
	var buttons = [];
	var exports = {};

	var getDiscount = function(page) {
		$ionicLoading.show({
			template: 'Please wait...'
		});
		API.Page.request(page.facebook_id).success(function(result) {
			page.is_requested = true;
			$ionicLoading.hide();
			$ionicLoading.show({
				template: '<i class="ion-checkmark-circled icon-accessory mb0"></i><p class="mt10">Your request<br/>has been sent<br/>successfully.</p>',
				showDelay: 500,
				duration: 2000
			});
			API.Insight.log('page;' + page.facebook_id + ';request');
		}).error(function(reason) {
			$ionicLoading.hide();
		});
	};

	var subscribe = function(page, cb) {
		API.Page.subscribe(page.facebook_id).success(function(result) {
			API.Insight.log('page;' + page.facebook_id + ';subscribe');
			page.is_subscribed = true;
			if(current_user.subscribed_pages) {
				current_user.subscribed_pages.data.push(page.facebook_id);
			}
			$rootScope.$broadcast('onPageSubscribe');
		}).error(function(reason) {
		});
	};
	
	var share = function(page) {
		var $scope = $rootScope.$new();
		
		$scope.page = page;
		
		$scope.closeModal = function() {
			$scope.modal.hide();
		};		
		
		API.User.friends().then(function(friends) {
			$scope.friends = friends.data;
			var friendsModalTitle = 'Share with Friends';
			
			var onClick = function(friend_id) {
				$ionicLoading.show({
					template: 'Please wait...'
				});
				API.User.sharePage(friend_id, $scope.page)
				.then(function() {
					API.Insight.log('page;' + $scope.page.facebook_id + ';share');
					$ionicLoading.hide();
					$scope.modal.hide();
				})
				.catch(function() {
					$ionicLoading.hide();
					alert('Error');
				});
			};
			
			MainService.showFriends({
				title: 'Share Store',
				subtitle: 'Select friend from the list',
				onClick: onClick,
				scope: $scope
			});      
		}).catch(function() {
		});
	};
				
	var unsubscribe = function(page) {
		var confirmPopup = $ionicPopup.show({
			title: 'Unsubscribe',
			template: "<p align='center' class='mb0'>Do you want to unsubscribe from this store?</p>",
			buttons: [
				{
					class: "btn-primary",
					text: '<strong>Cancel</strong>',
					onTap: function(e) {
					}
				},
				{
					text: 'OK',
					onTap: function(e) {
						API.Page.unsubscribe(page.facebook_id).success(function(result) {
							API.Insight.log('page;' + page.facebook_id + ';unsubscribe');
							page.is_subscribed = false;
							if(current_user.subscribed_pages) {
								current_user.subscribed_pages.data.splice(current_user.subscribed_pages.data.indexOf(page.facebook_id), 1);
							}
							$rootScope.$broadcast('onUnsubscribe', {page_id: page.facebook_id});
						}).error(function(reason) {
						});
					}
				}
			]
		});

	};
	
	var gotoFacebookProfile = function(page) {
		API.Insight.log('page;' + page.facebook_id + ';click' + '|' + 'page;' + page.facebook_id + ';facebook');
		API.Link.redirect('https://www.facebook.com/profile.php?id=' + page.facebook_id);
	};
	
	var gotoWebsite = function(page) {
		API.Insight.log('page;' + page.facebook_id + ';click');
		API.Link.goto({obj_name: 'page', obj_id: page.facebook_id});
	};

	exports.openModalOffers = function(page) {
		var $scope = $scope || $rootScope.$new();

		$scope.page = page;
	
		$scope.closeModal = function() {
			$scope.modal.hide();
		};
		
		$scope.showActions = function(page) {
			exports.showActions(page);
		};
		
		$scope.ctaAction = function(offer) {
			API.Link.goto({obj_name: 'offer', obj_id: offer._id});			
		};
		
		$ionicModal.fromTemplateUrl('templates/modal.offers.html', {
			scope: $scope,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.modal = modal;
			$scope.modal.show();
		});
	};
			
	exports.share = function(page) {
		share(page);
	};
	
	exports.gotoWebsite = function(page) {
		gotoWebsite(page);
	};
				
	exports.gotoFacebookProfile = function(page) {
		gotoFacebookProfile(page);
	};

	exports.getDiscount = function(page) {
		getDiscount(page);
	};

	exports.subscribe = function(page) {
		subscribe(page);
	};

	exports.unsubscribe = function(page) {
		unsubscribe(page);
	};
	
	exports.prepareActions = function(page) {
		buttons = [];
		if('is_subscribed' in page && !page.is_subscribed) {
			buttons.push({ text: 'Subscribe', action: 'SUBSCRIBE' });
		}
		// if(page.is_subscribed && !page.is_requested) {
		// 	buttons.push({ text: 'Ask for Discount', action: 'DISCOUNT_REQUEST' });
		// }
		buttons.push({ text: 'Go to Website', action: 'WEBSITE' });
		buttons.push({ text: 'Share with Friends', action: 'SHARE' });
		buttons.push({ text: 'Go to Facebook Profile', action: 'FACEBOOK_PROFILE' });
		if(page.is_subscribed) {
			buttons.push({ text: 'Unsubscribe', action: 'UNSUBSCRIBE' });
		}
	};
	
	exports.showActions = function(page) {
		var self = this;
		self.prepareActions(page);
		
		hideSheet = $ionicActionSheet.show({
			buttons: buttons,
			titleText: page.name,
			cancelText: 'Cancel',
			cancel: function() {
				hideSheet();
			},
			buttonClicked: function(index, more) {
				switch(more.action) {
					case 'UNSUBSCRIBE': 
						unsubscribe(page);
						break;
					case 'SUBSCRIBE': 
						subscribe(page);
						break;
					case 'SHARE': 
						share(page);
						break;
					case 'DISCOUNT_REQUEST': 
						getDiscount(page);
						break;
					case 'FACEBOOK_PROFILE': 
						gotoFacebookProfile(page);
						break;
					case 'WEBSITE':
						gotoWebsite(page);
						break;      
					case 'SHOW_ON_MAP':
						showOnMap(page);
						break;      
					default:
					break;              
				}
				return true;
			}
		});        
	};
	
	return ( exports );
}])

.service('AppInit', ['$rootScope', '$localStorage', 'DataService', 'API', function($rootScope, $localStorage, DataService, API) {
	var refreshUserData = function(callback) {
		callback = callback || function() {};
		API.User.synch()
			.success(function(updated) {
				if(updated) {
					DataService.updateMe(updated, function() {
						callback();
					});
				}
			})
	};

	var doAuth = function(eventName, cb) {
		if(!navigator.onLine) {
			if(eventName !== 'reconnect') {
				$rootScope.$broadcast('Cordova.NetworkStatus.Offline');
			}
			$rootScope.isLoading = false;
			cb(false);
		} else {
			$rootScope.$broadcast('Cordova.NetworkStatus.Online');
		}
	
		DataService.isAuthed(function(err, status) {
			is_authenticated = status;
			$rootScope.isAdmin = is_admin;
			if(is_authenticated) {
				DataService.getMe(function(err, me) {
					current_user = me.me;
					return cb(true);
				});
			} else {
				return cb(false);
			}    
		});
	}
	
	return {
		doAuth: doAuth,
		refreshUserData: refreshUserData
	}
}])

.service('APIInterceptor', function($rootScope, $q, CONFIG) {
  var service = this;
  
  service.request = function(config) {
		if(!isOnline) {
			return config;
		}

    if (access_token) {
      config.headers['x-access-token'] = access_token;
      config.headers['x-platform'] = 'mobile';
      config.headers['x-version'] = version;
    }
    return config;
  };

  service.response = function(response) {
    if (response.config.url.indexOf(CONFIG.api.url) > -1 && response.status === 200) {
      $rootScope.$broadcast('serverAlive');
      $rootScope.isEndpointError = false;
    }
    return $q.resolve(response);
  };

  service.responseError = function(response) {
		if($rootScope.isInternetError) {
			$rootScope.$broadcast('ptr-done');
			return $q.reject(response);
		}

    if (response.status === 401) {
      $rootScope.$broadcast('unauthorized');
    }
		
    if (response.status === 408 || response.status === 0) {
      $rootScope.$broadcast('timeout');
    }
    return $q.reject(response);
  };
})

.factory(
		"httpi",
		[ "$http", "$q", "HttpiResource", 
		function httpiFactory( $http, $q, HttpiResource ) {

			// I proxy the $http service and merge the params and data values into 
			// the URL before creating the underlying request.
			function httpProxy( config ) {

				config.url = interpolateUrl( 
					config.url,
					config.params,
					config.data, 
					( config.keepTrailingSlash != true )
				);

				// NOTE: Adding the abort is a two-phase process (see below).
				var abort = addAbortHook( config );

				var request = $http( config );

				// Now that we have the request, inject the abort hook method. Unfortunately,
				// this has to be done in a two-step process since the timer has to be set up
				// before the request is initiated.
				// --
				// NOTE: The abort() method can be detached from the request and it will still
				// work properly (ie, does not rely on "this").
				request.abort = abort;

				return( request );

			}


			// I create a new Httpi Resource for the given URL.
			httpProxy.resource = function( url ) {

				return( new HttpiResource( httpProxy, url ) );

			};


			// Return the factory value.
			return( httpProxy );


			// ---
			// PRIVATE METHODS.
			// ---


			// If the timeout configuration is available (ie, not already set by the 
			// user), then I inject a deferred value and return a function that will 
			// resolve the deferred value, thereby aborting the request.
			// --
			// NOTE: This behavior is only as of AngularJS 1.1.5 (unstable) or 
			// AngularJS 1.2 (stable).
			function addAbortHook( config ) {

				// If the timeout property is already set by the user, there's nothing we
				// can do - return the no-op abort method.
				if ( config.timeout ) {

					return( noopAbort );

				}

				// If the timeout wasn't already set, we can create an abort that will 
				// resolve the promise that we'll inject into the request configuration.
				var abort = function() {

					abort.deferred.resolve();

				};

				abort.deferred = $q.defer();

				config.timeout = abort.deferred.promise;

				return( abort );

			}			


			// I move values from the params and data arguments into the URL where 
			// there is a match for labels. When the match occurs, the key-value 
			// pairs are removed from the parent object and merged into the string
			// value of the URL.
			function interpolateUrl( url, params, data, removeTrailingSlash ) {

				// Make sure we have an object to work with - makes the rest of the
				// logic easier. 
				params = ( params || {} );
				data = ( data || {} );

				// Strip out the delimiter fluff that is only there for readability
				// of the optional label paths.
				url = url.replace( /(\(\s*|\s*\)|\s*\|\s*)/g, "" );

				// Replace each label in the URL (ex, :userID).
				url = url.replace(
					/:([a-z]\w*)/gi,
					function( $0, label ) {

						// NOTE: Giving "data" precedence over "params".
						return( popFirstKey( data, params, label ) || "" );

					}
				);

				// Strip out any repeating slashes (but NOT the http:// version).
				url = url.replace( /(^|[^:])[\/]{2,}/g, "$1/" );

				// Strip out any trailing slash if necessary.
				if ( removeTrailingSlash ) {

					url = url.replace( /\/+$/i, "" );
					
				}

				return( url );

			}


			// I provide the default abort behavior, which doesn't do anything.
			function noopAbort() {

				if ( console && console.warn ) {

					console.warn( "This request cannot be aborted because the [timeout] property was already being used." );

				}

			}


			// I take 1..N objects and a key and perform a popKey() action on the 
			// first object that contains the given key. If other objects in the list
			// also have the key, they are ignored.
			function popFirstKey( object1, object2, objectN, key ) {

				// Convert the arguments list into a true array so we can easily 
				// pluck values from either end.
				var objects = Array.prototype.slice.call( arguments );

				// The key will always be the last item in the argument collection.
				var key = objects.pop();

				var object = null;

				// Iterate over the arguments, looking for the first object that
				// contains a reference to the given key.
				while ( object = objects.shift() ) {

					if ( object.hasOwnProperty( key ) ) {

						return( popKey( object, key ) );

					}

				}

			}


			// I delete the key from the given object and return the value.
			function popKey( object, key ) {

				var value = object[ key ];

				delete( object[ key ] );

				return( value );

			}

		}
	])


	// I provide a proxy for the given http service that injects the same URL in every
	// one of the outgoing requests. It is intended to be used with "httpi", but it has
	// no direct dependencies other than the general format of the $http configuration.
	.factory(
		"HttpiResource",
		function httpiResourceFactory() {

			// I provide a resource that injects the given URL into the configuration
			// object before passing it off to the given http service.
			function Resource( http, url ) {

				// Store the http service.
				this._http = http;

				// Store the URL to inject.
				this._url = url;

				// I determine if the trailing slash should be kept in place.
				this._keepTrailingSlash = false;

				return( this );

			}


			// Define the instance methods.
			Resource.prototype = {

				// We have to explicitly set the constructor since we are overriding the
				// prototype object (which naturally holds the constructor).
				constructor: Resource,


				// ---
				// PUBLIC METHODS.
				// ---


				// I execute a DELETE request and return the http promise.
				delete: function( config ) {
					
					return( this._makeHttpRequest( "delete", config ) );

				},


				// I execute a GET request and return the http promise.
				get: function( config ) {

					return( this._makeHttpRequest( "get", config ) );

				},


				// I execute a HEAD request and return the http promise.
				head: function( config ) {

					return( this._makeHttpRequest( "head", config ) );

				},


				// I execute a JSONP request and return the http promise.
				jsonp: function( config ) {

					return( this._makeHttpRequest( "jsonp", config ) );

				},


				// I execute a POST request and return the http promise.
				post: function( config ) {

					return( this._makeHttpRequest( "post", config ) );

				},


				// I execute a PUT request and return the http promise.
				put: function( config ) {

					return( this._makeHttpRequest( "put", config ) );

				},


				// I set whether or not the resource should keep the trailing slash after
				// URL interpolation. Returns the resource reference for method chaining.
				setKeepTrailingSlash: function( newKeepTrailingSlash ) {

					this._keepTrailingSlash = newKeepTrailingSlash;

					// Return a reference to the instance.
					return( this );

				},


				// ---
				// PRIVATE METHODS.
				// ---


				// I prepare the configuration for the given type of request, then initiate
				// the underlying httpi request.
				_makeHttpRequest: function( method, config ) {

					// Ensure the configuration object exists.
					config = ( config || {} );

					// Inject resource-related properties.
					config.method = method;
					config.url = this._url;
					
					// Only inject trailing slash property if it's not already in the config.
					if ( ! config.hasOwnProperty( "keepTrailingSlash" ) ) {

						config.keepTrailingSlash = this._keepTrailingSlash
							
					}

					if ( config.method === "jsonp" ) {

						// Make sure the JSONP callback is defined somewhere in the config 
						// object (AngularJS needs this to define the callback handle).
						this._paramJsonpCallback( config );

					}

					return( this._http( config ) );

				},


				// I make sure the callback marker is defined for the given JSONP request
				// configuration object.
				_paramJsonpCallback: function( config ) {

					var callbackName = "JSON_CALLBACK";

					// Check to see if it's in the URL already.
					if ( this._url.indexOf( callbackName ) !== -1 ) {
						
						return;

					}

					// Check to see if it's in the params already.
					if ( config.params ) {

						for ( var key in config.params ) {

							if ( 
								config.params.hasOwnProperty( key ) && 
								( config.params[ key ] === callbackName )
								) {

								return;

							}

						}

					// If there are no params, then make one so that we have a place to
					// inject the callback.
					} else {

						config.params = {}

					}

					// If we made it this far, then the current configuration does not
					// account for the JSONP callback. As such, let's inject it into the
					// params.
					config.params.callback = callbackName;

				}

			};


			// Return the constructor as the AngularJS factory result.
			return( Resource );

		}
	)
	;