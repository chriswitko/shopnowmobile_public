/* global ionic */
angular.module( 'shopnow.controllers.login', [] )

.controller('LoginCtrl', [
  '$scope', 
  '$controller',
  '$ionicPopup', 
  '$ionicHistory',
  'API', 
  'DataService', 
  'ngFB', 
  function ($scope, $controller, $ionicPopup, $ionicHistory, API, DataService, ngFB) {
    $scope.trackView('Login');

    $controller('BaseController', {$scope: $scope});

    if(window.cordova && window.cordova.getAppVersion) {
      cordova.getAppVersion.getVersionNumber().then(function (v) {
        version = v;
        $scope.viewOptions.version = version;
      });
    }      
   
    $scope.isLoading = false;
    
    $scope.fbLogin = function () {
      $scope.initFacebook();
      $scope.isLoading = true;
      
      ngFB.login({scope: 'email,user_likes,user_friends,user_birthday'})
        .then(function (response) {
          if (response.status === 'connected') {
            
            API.User.oauth(response.authResponse.accessToken)
              .success(function(token){
                facebook_token = response.authResponse.accessToken;
                access_token = token.access_token;

                API.User.me()
                  .success(function(data) {
                    if(data && data.facebook_id) {
                      
                      current_user = data;
                      data.app_token = token.access_token;
                      access_token = data.app_token;
                      facebook_token = data.access_token;

                      DataService.appStorage['user_' + data.facebook_id] = {};
                      DataService.appStorage['user_' + data.facebook_id] = {
                        me: {},
                        app: {}
                      }; 
                      
                      DataService.appStorage.currentID = data.facebook_id;
                      DataService.appStorage['user_' + data.facebook_id]= {me:  data};

                      $scope.isLoading = false;
                      if(data.is_ready) {
                        $ionicHistory.clearCache();
                        $scope.goto('shopnow.stores');
                      } else {
                        $scope.goto('welcome.onboarding', {isFirstTime: true}, {reload: true, inherit: true, notify: true});
                      }
                    } else {
                      $scope.isLoading = false;
                      $ionicPopup.alert({
                        title: 'Error',
                        template: 'Auth problems'
                      });
                    }
                  })
                  .error(function(err) {
                    $scope.isLoading = false;
                    $ionicPopup.alert({
                      title: 'Error',
                      template: 'Auth problems'
                    });
                  })
              })
              .error(function(err){
                $scope.isLoading = false;
                $ionicPopup.alert({
                  title: 'Sorry', 
                  template: '<p class="align-center mb0">We could not complete your registration. Pleas try again.<br/><br/> <a class="color-facebook-accent" href="https://shopnowapp.com/help" target="_system">Click here to learn more...</a></p>'
                });
              });
          } else {
            $scope.isLoading = false;
            $ionicPopup.alert({
              title: 'Error',
              template: 'Facebook login failed'
            });
          }
      }, function(error) {
        $scope.isLoading = false;
        $ionicPopup.alert({
          title: 'Error',
          template: 'Facebook login failed'
        });
      });
    };
  }
])