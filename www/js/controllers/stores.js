/* global ionic */

angular.module( 'shopnow.controllers.stores', ['shopnow.controllers.base'] )

.controller('StoresCtrl', [
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
      $scope.getStores(mode, {after: after}).then(function() {
        var new_ids = _.filter(dataset.stores.data, function(dataItem) {
          return !(_.filter($scope.viewOptions.items, function(scopeItem) {
            return dataItem.facebook_id === scopeItem.facebook_id;
          }).length);
        });
        
        // if(new_ids.length) {
        $scope.viewOptions.items = dataset.stores.data;
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
    
    $scope.countRecommended = function(mode) {
      $scope.getRecommended(mode, {after: 1, summary: 1}).then(function(result) {
        if(result.data) {
          $scope.totalRecommended = result.data.length;
        }
      });
    };
            
    $scope.doRefresh = function(mode) {
      $scope.viewOptions.loading_mode = mode;
      $scope.lastOpenedAt = new Date().valueOf();
      
      if($scope.isOffline) {
        $scope.isFetched();
        return;
      }
      
      switch(mode) {
        case LOADING_MODE.init:
          $scope.trackView('Stores');
          $scope.registerUserDevice();        
          $scope.display(mode);
          $scope.displayShared();
          $scope.getOffers();
          $scope.countRecommended(mode);
          break;
        case LOADING_MODE.tap:
          $scope.display(mode);
          $scope.displayShared();
          $scope.getOffers();
          break;
        case LOADING_MODE.ptr:
          $scope.display(mode);
          $scope.displayShared();
          $scope.countRecommended(mode);
          break;
        case LOADING_MODE.more:
          $scope.display(mode);
          break;
        case LOADING_MODE.resume:
          $scope.onResume(LOADING_MODE.resume);
          $scope.countRecommended(mode);          
          break;
        default:
          console.log('Undefined LOADING_MODE', mode);
          break;
      };
    };
    
    $scope.onResume = function(mode) {
      var now = new Date().valueOf();
      var diffMs = now - $scope.lastOpenedAt;
      var diffMin = Math.round(((diffMs % 86400000) % 3600000) / 60000);

      if(diffMin >= 5) {
        $scope.scrollTop();
        $scope.display(mode);
        $scope.displayShared();
      }      
    };

    $scope.$on('onResume', function() {
      $scope.onResume();
    });
    
    $scope.$on('onTap', function() {
      $scope.doRefresh(LOADING_MODE.resume);
    });
    
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
        $scope.doRefresh(LOADING_MODE.resume);
      } else {
        $scope.doRefresh(LOADING_MODE.init);
      }
    });
  }  
])