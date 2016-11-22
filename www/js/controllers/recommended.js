/* global ionic */

angular.module( 'shopnow.controllers.recommended', ['shopnow.controllers.base'] )

.controller('RecommendedCtrl', [
  '$scope',
  '$controller', 
  'API',
  function ($scope, $controller, API) {
    $controller('BaseController', {$scope: $scope});

    var after = 1;
    
    _.extend($scope.viewOptions, {shared: []});
    
    $scope.display = function(mode) {
      if(mode === LOADING_MODE.ptr) {
        dataset.stores.data = [];
      }
      
      if(mode !== LOADING_MODE.more) {
        after = 1;
      }
      
      $scope.isFetching();
      // console.log({after: after});
      $scope.getRecommended(mode, {after: after}).then(function() {
        var new_ids = _.filter(dataset.recommended.data, function(dataItem) {
          return !(_.filter($scope.viewOptions.items, function(scopeItem) {
            return dataItem.facebook_id === scopeItem.facebook_id;
          }).length);
        });
        
        // if(new_ids.length) {
        $scope.viewOptions.items = dataset.recommended.data;
        // }
  
        after++;

        $scope.isFetched();
      });
    };

    $scope.displayShared = function() {
      $scope.getShared().then(function() {
        $scope.viewOptions.shared = dataset.shared.data;
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
          $scope.trackView('Recommended');
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

    $scope.$on('onUnsubscribe', function(event, data) {
      _.map($scope.viewOptions.items, function(page) {
        if(page.facebook_id === data.page_id) {
          page.is_subscribed = false;
        }
        return page;
      });
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