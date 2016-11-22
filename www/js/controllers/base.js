/* global ionic */
angular.module( 'shopnow.controllers.base', [] )

.controller('BaseController', [
  '$scope',
  '$rootScope',
  '$state',
  '$ionicScrollDelegate',
  '$ionicTabsDelegate',
  '$ionicActionSheet', 
  '$q',
  'DataService',
  'API',
  'AppInit',
  'ngFB',
  'UI',
  'MainService',
  'CONFIG'
  , function($scope, $rootScope, $state, $ionicScrollDelegate, $ionicTabsDelegate, $ionicActionSheet, $q, DataService, API, AppInit, ngFB, UI, MainService, CONFIG) {
    $scope.lastOpenedAt = new Date().valueOf();
    $scope.search = {focus: 0, value: ''};
    $scope.VIEW_MODE = VIEW_MODE;
    $scope.LOADING_MODE = LOADING_MODE;
    $scope.DATA_LOAD_STATE = DATA_LOAD_STATE;

    $scope.viewOptions = {
      tab: 'default',
      mode: VIEW_MODE.default,
      loading_mode: LOADING_MODE.init,
      data_load_state: DATA_LOAD_STATE.loading,
      items: null
    };
    
    $scope.live = [];
    $scope.offers = [];

    $scope.isWebView = window.cordova ? false : true;
    $scope.isIOS = ionic.Platform.isIOS();
    $scope.isAndroid = ionic.Platform.isAndroid();
    $scope.currentPlatform = ionic.Platform.platform();
    
    $scope.getUser = function() {
      var dfd = $q.defer()
      AppInit.refreshUserData(function() {
        dfd.resolve();
      });
      return dfd.promise;
    }; 

    $scope.fullScreen = function() {
      if(window.StatusBar) {
        window.StatusBar.styleDefault();
        window.StatusBar.hide();
        ionic.Platform.fullScreen(true);
      }         
    };

    $scope.normalScreen = function() {
      if(window.StatusBar) {
        window.StatusBar.styleDefault();
        window.StatusBar.show();
        ionic.Platform.fullScreen(false);
      }         
    };

    $scope.logout = function () {
      var hideSheet = $ionicActionSheet.show({
        buttons: [
          { text: 'Sign Out' }
        ],
        cancelText: 'Cancel',
        cancel: function() {
          hideSheet();
        },
        buttonClicked: function(index) {
          if(index === 0) {
            API.User.logout();
          }
          return true;
        }
      });
      return;
    };
    
    $scope.refreshPermissions = function() {
      API.User.refreshPermissions(function() {
        $scope.doRefresh(LOADING_MODE.init);
      });
    };
    
    $scope.isFetching = function() {
      $scope.viewOptions.data_load_state = DATA_LOAD_STATE.loading;
      $scope.lastOpenedAt = new Date().valueOf();
    };
    
    $scope.isFetched = function() {
      $scope.viewOptions.data_load_state = DATA_LOAD_STATE.loaded;
      $scope.finishPullToRefresh();
      $scope.resize();
    };
    
    $scope.finishPullToRefresh = function() {
      $scope.$broadcast('scroll.refreshComplete');      
    };
    
    $scope.doPullToRefresh = function(tab) {
      $scope.doRefresh(LOADING_MODE.ptr);
    };
  
    $scope.doMore = function() {
      $scope.doRefresh(LOADING_MODE.more);
    };
    
    var fetchStores = function(options) {
      var dfd = $q.defer();
      API.User.getStores({limit: 10, after: options.after}).then(function(result) {
        dfd.resolve(result);
      });
      return dfd.promise;
    };

    var fetchRecommended = function(options) {
      var dfd = $q.defer();
      API.User.getRecommended({limit: 10, after: options.after}).then(function(result) {
        dfd.resolve(result);
      });
      return dfd.promise;
    };
    
    var fetchPosts = function(options) {
      var dfd = $q.defer();
      API.User.getPosts({limit: 20, after: options.after}).then(function(result) {
        dfd.resolve(result);
      });
      return dfd.promise;
    };

    var fetchPostsSuggested = function(options) {
      var dfd = $q.defer();
      API.User.getPostsSuggested({limit: 10, after: options.after}).then(function(result) {
        dfd.resolve(result);
      });
      return dfd.promise;
    };
        
    var fetchShared = function() {
      var dfd = $q.defer();
      API.User.getSharedPages({limit: 10}).then(function(result) {
        dfd.resolve(result);
      });
      return dfd.promise;
    };

    var fetchOffers = function(options) {
      var dfd = $q.defer();
      API.User.getForYou({limit: 100}).then(function(result) {
        dfd.resolve(result);
      });
      return dfd.promise;
    };
        
    $scope.hasFacebookTokenError = function() {
      $scope.viewOptions.isFacebookTokenError = true;
    };

    $scope.hasNoFacebookTokenError = function() {
      $scope.viewOptions.isFacebookTokenError = false;
    };
    
    $scope.setBadgeCounter = function(number) {
      if(window.cordova) {
        cordova.plugins.notification.badge.set(1);
      }      
    };

    $scope.openAboutUrl = function() {
      UI.openAboutUrl();
    };
  
    $scope.openTermsUrl = function() {
      UI.openTermsUrl();
    };

    $scope.openFriends = function() {
      MainService.showFriends({});
    };
        
    $scope.getOffers = function(mode, options) {
      var dfd = $q.defer();

      fetchOffers().then(function(result) {
        if(mode === LOADING_MODE.more) {
          dataset.offers.data = dataset.offers.data.concat(result.data);
        } else {
          dataset.offers = result;
        }
        if(dataset.offers.total) {
          $rootScope.availableOffersTotal = 'NEW';
          $scope.setBadgeCounter(1);
        }
        dfd.resolve(result);
      });
      return dfd.promise;
    };

    $scope.getSaved = function(mode, options) {
      var dfd = $q.defer();
      $scope.hasNoFacebookTokenError();
      var current_user = DataService.getMe().me;

      if(!current_user.saved || !current_user.saved.data) {
        return dfd.resolve([]);
      }
      
      API.Post.feed(current_user.saved.data, 60, 50).then(function(result) {
        if(mode === LOADING_MODE.more) {
          dataset.saved = dataset.saved.concat(result.posts);
        } else {
          dataset.saved = result.posts;
        }
        dataset.saved.reverse();
        
        _.map(dataset.saved, function(post) {
          if(current_user.saved) {
            post.is_saved = (current_user.saved.data || []).indexOf(post.id) > -1;
          }
        });
        
        dfd.resolve(dataset.saved);
      }).catch(function() {
        $scope.hasFacebookTokenError();
        dfd.reject();
      });
      return dfd.promise;      
    };
        
    $scope.getNewsfeed = function(mode, options) {
      $scope.hasNoFacebookTokenError();
      var dfd = $q.defer();
      fetchPosts({after: options.after || 1}).then(function(result) {
        if(!result.data.length) {
          return dfd.reject();
        }
        API.Page.newsfeed(result.data).then(function(result) {
          if(mode === LOADING_MODE.more) {
            dataset.newsfeed = dataset.newsfeed.concat(result.posts);
          } else {
            dataset.newsfeed = result.posts;
          }
          
          var current_user = DataService.getMe().me;
          _.map(dataset.newsfeed, function(post) {
            if(current_user.saved) {
              post.is_saved = (current_user.saved.data || []).indexOf(post.id) > -1;
            }
          });
          
          var tmp_posts = _.filter(dataset.newsfeed, function(post) {
            return post.message && post.message.length;
          });
          
          dfd.resolve(tmp_posts);
        }).catch(function() {
          $scope.hasFacebookTokenError();
          dfd.reject();
        });
      });
      return dfd.promise;      
    };
    
    $scope.getNewsfeedSuggested = function(mode, options) {
      $scope.hasNoFacebookTokenError();
      var dfd = $q.defer();
      fetchPostsSuggested({after: options.after || 1}).then(function(result) {
        if(!result.data.length) {
          return dfd.reject();
        }
        API.Page.newsfeed(result.data).then(function(result) {
          if(mode === LOADING_MODE.more) {
            dataset.newsfeed_suggested = dataset.newsfeed_suggested.concat(result.posts);
          } else {
            dataset.newsfeed_suggested = result.posts;
          }
          
          var current_user = DataService.getMe().me;
          _.map(dataset.newsfeed_suggested, function(post) {
            if(current_user.saved) {
              post.is_saved = (current_user.saved.data || []).indexOf(post.id) > -1;
            }
          });
          
          var tmp_posts = _.filter(dataset.newsfeed_suggested, function(post) {
            return post.message && post.message.length;
          });
          
          dfd.resolve(tmp_posts);
        }).catch(function() {
          $scope.hasFacebookTokenError();
          dfd.reject();
        });
      });
      return dfd.promise;      
    };    
        
    $scope.getStores = function(mode, options) {
      var dfd = $q.defer();

      fetchStores({after: options.after || 1}).then(function(result) {
        if(mode === LOADING_MODE.more) {
          dataset.stores.data = dataset.stores.data.concat(result.data);
        } else {
          dataset.stores = result;
        }
        dfd.resolve(result);
      });
      return dfd.promise;
    };

    $scope.getRecommended = function(mode, options) {
      var dfd = $q.defer();

      fetchRecommended({after: options.after || 1}).then(function(result) {
        if(mode === LOADING_MODE.more) {
          dataset.recommended.data = dataset.recommended.data.concat(result.data);
        } else {
          dataset.recommended = result;
        }
        dfd.resolve(result);
      });
      return dfd.promise;
    };
        
    $scope.getShared = function() {
      var dfd = $q.defer()
      fetchShared().then(function(result) {
        dataset.shared = result; 
        dfd.resolve(result);
      });
      return dfd.promise;
    };    
    
    $scope.$on('onPullToRefresh', function() {
      $scope.isFetched();
    });

    $scope.$on('Cordova.NetworkStatus.Offline', function() {
      $scope.isFetched();
      $scope.isOffline = true;
      UI.showAlert({text: 'Internet connection is not available', bannerType: 'error'});
    });     
    
    $scope.$on('Cordova.NetworkStatus.Online', function() {
      $scope.isFetched();
      $scope.isOffline = false;
    });           

    $scope.initSearch = function() {
      $scope.$on('onHideSearch', function() {
        $scope.search.value = '';
        $scope.search.focus = false;
        $scope.doSearch();
        $scope.viewOptions.mode = VIEW_MODE.default;
      });

      $scope.$on('onShowSearch', function() {
        $scope.search.focus = true;
        $scope.scrollTop();
        $scope.viewOptions.searchResults = [];
        $scope.viewOptions.mode = VIEW_MODE.search;
        $scope.$digest();
      });
    };
    
    $scope.scrollTop = function() {
      $ionicScrollDelegate.scrollTop();
    };

    $scope.goto = function(url) {
      $state.go(url);
    };

    $scope.resize = function() {
      $ionicScrollDelegate.resize();
    };

    $scope.initFacebook = function() {
      ngFB.init({appId: CONFIG.facebook.appID});
    };

    $scope.trackView = function(viewName) {
    };
    
    $scope.getVersion = function() {
      $scope.version = version;
    };

    $scope.closeModal = function() {
      $scope.modal.hide();
    };

    /*
      GLOBAL EVENTS
    */

    $scope.registerUserDevice = function() {
      if(window.plugins && window.plugins.OneSignal && !current_user.onesignal_id) {
        window.plugins.OneSignal.getIds(function(ids) {
          if(ids.pushToken) {
            API.User.registerDevice(ids.pushToken, ids.userId).then(function(result) {
              DataService.updateMe({enabled_notifications: true}, function() {
              });
            }).catch(function(err) {
            });          
          }
        });
      } else {
      }      
    };
    
    $scope.doTap = function(index, state_name) {
      $ionicTabsDelegate.select(index);
      if($state.current.name === state_name) {
        $scope.scrollTop();
        // $scope.doRefresh(LOADING_MODE.ptf);
        $scope.$broadcast('onTap');      
      }
    };

    $scope.$on('$destroy', function() {
      if($scope.modal) {
        $scope.modal.remove();
      }
    });      
  }
])