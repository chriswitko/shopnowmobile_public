/* global analytics */
/* global Ionic */
var db;
var push;
var user;
var current_user;
var access_token;
var facebook_token;
var version = '1.0.0';
var is_authenticated = false;
var is_admin = false;
var insights_bulk = [];
var deploy;
var lastPausedAt = new Date().valueOf();
var exclude_page_ids = [];
var cancelSearch = false;
var isOnline = true;

var dataset = {
  stores: [],
  newsfeed: [],
  newsfeed_suggested: [],
  recommended: [],
  offers: [],
  saved: [],
  shared: []
};

var DATA_LOAD_STATE = {
  failed: -1,
  loading: 1,
  loaded: 0
};

const LOADING_MODE = {
  init: 1,
  ptr: 2,
  tap: 3,
  resume: 4,
  more: 5,
  dataset: 6
};

const LOADING_STATE = {
  done: 0,
  loading: 1
};
    
const VIEW_MODE = {
  default: 0,
  search: 1
};

angular.module('shopnow', [
  'ionic',
  'ngCordova', 
  'shopnow.directives', 
  'shopnow.services',
  'shopnow.api', 
  'shopnow.controllers.offers', 
  'shopnow.controllers.stores', 
  'shopnow.controllers.search', 
  'shopnow.controllers.login', 
  'shopnow.controllers.onboarding', 
  'shopnow.controllers.newsfeed', 
  'shopnow.controllers.page', 
  'shopnow.controllers.saved', 
  'shopnow.controllers.recommended', 
  'shopnow.controllers.settings', 
  'shopnow.controllers.shopnow', 
  'shopnow.filter', 
  'ngLodash', 
  'angularMoment', 
  'ngOpenFB', 
  'LocalForageModule',
  'ngStorage',
  'monospaced.qrcode', 
  'ngIOS9UIWebViewPatch', 
  'ionic.ion.imageCacheFactory', 
  'jett.ionic.content.banner',
  'ionicLazyLoad',
  'pasvaz.bindonce',
  'ngAnimate',
  'ionicImgCache',
  'ngResource'
])

.constant('CONFIG', {
  app: {
    url: 'https://shopnowapp.com',
    aboutUrl: '/about',
    termsUrl: '/terms',
  },
  api: { 
    url: 'https://api.shopnowapp.com' // https://api.shopnowapp.com https://shopnowapi.localtunnel.me http://localhost:3000
  },
  facebook: {
    appID: '',
    appToken: ''
  }
})

.run(function($ionicPlatform, $state, $rootScope, $ionicModal, $ionicPopup, $ionicHistory, $localStorage, ngFB, CONFIG, API, DataService, UI, AppInit) {
  $ionicPlatform.ready(onReady);

  function initRootScope() {
    $rootScope.$storage = $localStorage;

    $rootScope.version = version;
    $rootScope.availableOffersTotal = 0;
  }
  
  function initVersion() {
    if(window.cordova && window.cordova.getAppVersion) {
      cordova.getAppVersion.getVersionNumber().then(function (v) {
        version = v;
      });
    }      
  }
  
  function initPushMessages() {
    var notificationOpenedCallback = function(jsonData) {
      if(jsonData.additionalData.view) {
        $state.go(jsonData.additionalData.view);
      }
    };
    
    if(window.plugins && window.plugins.OneSignal) {
      window.plugins.OneSignal.init("32eaf9d1-2dff-4f1c-907c-2ae7bd6c4a2e", {autoRegister: false}, notificationOpenedCallback);
    }          
  }
  
  function initOfflineEvents() {
    document.addEventListener('offline', function () {
      isOnline = navigator.onLine;
      $rootScope.isInternetError = navigator.onLine;
      $rootScope.$broadcast('Cordova.NetworkStatus.Offline');
    }, false);

    document.addEventListener('online', function () {
      isOnline = navigator.onLine;
      $rootScope.isInternetError = false;
      $rootScope.$broadcast('Cordova.NetworkStatus.Online');
    }, false);
    
    $rootScope.$on('timeout', function() {
      $rootScope.$broadcast('ptr-done');
      if(!$rootScope.isInternetError) {
        if(!$rootScope.isEndpointError) {
          $rootScope.isEndpointError = true;
        }
      } else {
        $rootScope.isEndpointError = true;
      }
    });   
     
    $rootScope.$on('Cordova.NetworkStatus.Offline', function() {
      $rootScope.$broadcast('ptr-done');
      if(!$rootScope.isEndpointError) {
        UI.showAlert({text: 'Internet connection is not available', bannerType: 'error'});
        $rootScope.isInternetError = true;
      }
    });
 
    $rootScope.$on('Cordova.NetworkStatus.Online', function() {
      $rootScope.isInternetError = false;
    });
  }
  
  function initLayout() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }

    if(window.StatusBar) {
      window.StatusBar.styleDefault();
      window.StatusBar.hide();
      ionic.Platform.fullScreen();
    }    
  }
  
  function initFB() {
    ngFB.init({appId: CONFIG.facebook.appID});
  }
  
  function initOnResume() {
    $ionicPlatform.on('resume', function() {
      refreshUserData();
      $rootScope.$broadcast('onResume');
    });    
  }
  
  function initOnPause() {
    $ionicPlatform.on('pause', function() {
      lastPausedAt = new Date().valueOf();
      refreshUserData();
      $rootScope.$broadcast('onPause');
    });    
  }
  
  function refreshUserData() {
    AppInit.refreshUserData(function() {
      current_user = DataService.getMe().me;
    });
  }
  
  function doAuth() {
    AppInit.doAuth('', function(status) {
      if(status) {
        refreshUserData();
        return $state.go('shopnow.stores');
      } else {
        return $state.go('login');
      }
    });
  }
  
  function onReady() {
    initRootScope();
    initOfflineEvents();
    initOnResume();
    initOnPause();
    initLayout();
    initFB();
    initPushMessages();
    initVersion();
    doAuth();
  };
})

.config(function($stateProvider, $compileProvider, $urlRouterProvider, $httpProvider, $provide, $ionicConfigProvider, $localForageProvider, $localStorageProvider) {
  $localStorageProvider.setKeyPrefix('shopnowapp');
  
  $compileProvider.debugInfoEnabled(false);
  $httpProvider.useApplyAsync(true);
  
  $localForageProvider.config({
		name: 'shopnowapp',
    storeName: 'mobile'
	});  
  $ionicConfigProvider.tabs.style('standard').position('bottom');
  $ionicConfigProvider.navBar.alignTitle('center').positionPrimaryButtons('left');

  $httpProvider.defaults.useXDomain = true;
  $httpProvider.defaults.cache = false;
  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
  delete $httpProvider.defaults.headers.common['X-Requested-With'];

  $stateProvider
    .state('login', {
      url: '/login',
      cache: false,
      templateUrl: 'templates/view.login.html',
      controller: 'LoginCtrl'
    })
    
    .state('login_email', {
      url: '/login_email',
      cache: false,
      templateUrl: 'templates/view.login.email.html',
      controller: 'LoginCtrl'
    })

    .state('register_email', {
      url: '/register_email',
      cache: false,
      templateUrl: 'templates/view.register.email.html',
      controller: 'LoginCtrl'
    })
        
    .state('welcome', {
      abstract: true,
      url: "/welcome",
      templateUrl: "templates/view.welcome.html"
    })

    .state('welcome.onboarding', {
      url: '/onboarding',
      cache: false,
      templateUrl: 'templates/view.welcome.onboarding.html',
      controller: 'OnboardingCtrl'
    })

    .state('shopnow', {
      abstract: true,
      url: "/shopnow",
      templateUrl: "templates/view.app.html"
    })
    
    .state('shopnow.offers', {
      url: '/offers',
      views: {
        'offers@': {
          templateUrl: 'templates/view.offers.html',
          controller: 'OffersCtrl'
        }
      }
    })

    .state('shopnow.recommended', {
      url: '/recommended',
      views: {
        'stores@': {
          templateUrl: 'templates/view.recommended.html',
          controller: 'RecommendedCtrl'
        }
      }
    })

    .state('shopnow.recommended.preview', {
      url: '/recommended/:pageID',
      params : { page: null, backTo: null, unshareAction: false, showOffersOnly: false },
      views: {
        'stores@': {
          templateUrl: 'templates/view.store.html',
          controller: 'PageCtrl',
        }
      }
    })
            
    .state('shopnow.stores', {
      url: '/stores',
      views: {
        'stores@': {
          templateUrl: 'templates/view.stores.html',
          controller: 'StoresCtrl'
        }
      }
    })

    .state('shopnow.stores.preview', {
      url: '/stores/:pageID',
      params : { page: null, backTo: null, unshareAction: false, showOffersOnly: false },
      views: {
        'stores@': {
          templateUrl: 'templates/view.store.html',
          controller: 'PageCtrl',
        }
      }
    })

    .state('shopnow.search', {
      url: '/search',
      views: {
        'stores@': {
          templateUrl: 'templates/view.search.html',
          controller: 'SearchCtrl'
        }
      }
    })
    
    .state('shopnow.newsfeed', {
      url: '/newsfeed',
      views: {
        'newsfeed@': {
          templateUrl: 'templates/view.newsfeed.html',
          controller: 'NewsFeedCtrl'
        }
      }
    })        

    .state('shopnow.newsfeed.preview', {
      url: '/stores/:pageID',
      params : { page: null, backTo: null, unshareAction: false, showOffersOnly: false },
      views: {
        'newsfeed@': {
          templateUrl: 'templates/view.store.html',
          controller: 'PageCtrl',
        }
      }
    })

    .state('shopnow.saved', {
      url: '/saved',
      views: {
        'saved@': {
          templateUrl: 'templates/view.saved.html',
          controller: 'SavedCtrl'
        }
      }
    })   

    .state('shopnow.saved.preview', {
      url: '/stores/:pageID',
      params : { page: null, backTo: null, unshareAction: false, showOffersOnly: false },
      views: {
        'saved@': {
          templateUrl: 'templates/view.store.html',
          controller: 'PageCtrl',
        }
      }
    })
                    
    .state('shopnow.settings', {
      url: '/settings',
      views: {
        'settings@': {
          templateUrl: 'templates/view.settings.html',
          controller: 'SettingsCtrl'
        }
      }
    })

  $httpProvider.defaults.timeout = 10000;
  $httpProvider.interceptors.push('APIInterceptor');
})




