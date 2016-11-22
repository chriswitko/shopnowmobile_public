/* global ionic */

angular.module( 'shopnow.controllers.settings', ['shopnow.controllers.base'] )

.controller('SettingsCtrl', [
  '$scope',
  '$controller',
  function ($scope, $controller) {
    $controller('BaseController', {$scope: $scope});

    $scope.prepareView = function(mode) {
      $scope.viewOptions.items = current_user;
      $scope.viewOptions.user = current_user;
      $scope.viewOptions.version = version;
              
      $scope.isFetched();
    };
    
    $scope.display = function(mode) {
      $scope.isFetching();
      
      $scope.getUser(mode).then(function() {
        $scope.prepareView(mode);
      }).catch(function() {
        $scope.prepareView(mode);
      });
    };

    $scope.doRefresh = function(mode) {
      $scope.viewOptions.loading_mode = mode;

      if($scope.isOffline) {
        $scope.isFetched();
        return;
      }
      
      switch(mode) {
        case LOADING_MODE.init:
          $scope.trackView('Settings');
          $scope.display(mode);
          break;
        case LOADING_MODE.tap:
          $scope.display(mode);
          break;
        case LOADING_MODE.ptr:
          $scope.display(mode);
          break;
        case LOADING_MODE.more:
          $scope.display(mode);
          break;
        case LOADING_MODE.resume:
          $scope.display(mode);
          break;
        default:
          console.log('Undefined LOADING_MODE', mode);
          break;
      };
    };

    $scope.$on('onTap', function() {
      $scope.doRefresh(LOADING_MODE.resume);
    });
        
    $scope.$on( "$ionicView.enter", function( scopes, states ) {
      if(states.fromCache) {
        // $scope.onResume();
      } else {
        $scope.doRefresh(LOADING_MODE.init);
      }
    });
  }  
])