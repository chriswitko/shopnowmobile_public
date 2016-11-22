/* global ionic */
angular.module( 'shopnow.controllers.onboarding', [] )

.controller('OnboardingCtrl', [
  '$scope', 
  '$controller',
  '$ionicPopup', 
  '$ionicSlideBoxDelegate',
  '$timeout',
  '$ionicHistory',
  'API', 
  'DataService', 
  'Insights', 
  'ngFB', 
  function ($scope, $controller, $ionicPopup, $ionicSlideBoxDelegate, $timeout, $ionicHistory, API, DataService, Insights, ngFB) {
    $scope.trackView('Onboarding');

    $controller('BaseController', {$scope: $scope});

    var checkpoint = null;
    $scope.brands = [];
    $scope.is_ready = false;
    $scope.count_subscriptions = 0;
    
    $scope.isLoading = false;

    $scope.getStarted = function() {
      $ionicHistory.clearCache();
      $scope.goto('shopnow.stores', {refreshRequired: true}, {reload: true, inherit: true, notify: true});
    };
    
    $scope.checkIfReady = function() {
      API.User.me()
        .success(function(data) {
          $scope.count_subscriptions = data.count_subscriptions;
          if(data.is_ready) {
            current_user.is_ready = true;
            API.User.getAllPages({reset: true, random: true, purge: true})
              .then(function(result) {
                $scope.brands = result.data;
                $scope.is_ready = true;
                $timeout.cancel(checkpoint);
              })
              .catch(function() {
                $scope.is_ready = true;
                $timeout.cancel(checkpoint);
              });
          } else {
            $scope.waitForReady();
          }
        })
    };
    
    $scope.waitForReady = function() {
      checkpoint = $timeout(function() {
        $scope.checkIfReady();
      }, 3000)
    };

    $scope.slideHasChanged = function($index) {
      switch ($index) {
        case 2:
          $scope.enableNotifications();
          break;
        case 4:
          $ionicSlideBoxDelegate.enableSlide(false);
          $scope.waitForReady();
          break;
      }
    };

    $scope.enableNotifications = function() {
      var confirmPopup = $ionicPopup.show({
        title: 'Please turn on notifications',
        template: "<p align='center' class='mb0'>This way you'll know when brands you like send you personal discounts and offers.</p>",
        buttons: [
          {
            text: 'No, thanks',
            onTap: function(e) {
              current_user.enabled_notifications = false;
            }
          },
          {
            class: "btn-primary",
            text: '<strong>OK</strong>',
            onTap: function(e) {
              if(window.plugins && window.plugins.OneSignal) {
                window.plugins.OneSignal.registerForPushNotifications();
                window.plugins.OneSignal.enableInAppAlertNotification(true);
                window.plugins.OneSignal.getIds(function(ids) {
                  if(ids.pushToken) {
                    API.User.registerDevice(ids.pushToken, ids.userId).then(function(result) {
                      DataService.updateMe({enabled_notifications: true}, function() {
                      });
                    }).catch(function(err) {
                    });          
                  }
                });
              }
            }
          }
        ]
      });

      $scope.setHide = function() {
        current_user.enabled_notifications = true;
      };

      confirmPopup.then(function(res) {
        $ionicSlideBoxDelegate.next();
      });
    };
  
  }
])