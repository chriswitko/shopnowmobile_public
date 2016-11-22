/* global ionic */

angular.module( 'shopnow.controllers.saved', ['shopnow.controllers.base'] )

.controller('SavedCtrl', [
  '$scope',
  '$controller',
  function ($scope, $controller) {
    $controller('BaseController', {$scope: $scope});

    $scope.prepareView = function(mode) {
      var new_ids = _.filter(dataset.saved, function(dataItem) {
        return !(_.filter($scope.viewOptions.items, function(scopeItem) {
          return dataItem.id === scopeItem.id;
        }).length);
      });
      
      $scope.viewOptions.items = dataset.saved;

      $scope.isFetched();
    };
    
    $scope.display = function(mode) {
      if(mode === LOADING_MODE.ptr) {
        dataset.saved = [];
      }
      
      $scope.isFetching();
      
      $scope.getSaved(mode).then(function() {
        $scope.prepareView(mode);
      }).catch(function() {
        $scope.prepareView(mode);
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
          $scope.trackView('Saved');
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

    $scope.$on('onResume', function() {
      var now = new Date().valueOf();
      var diffMs = now - $scope.lastOpenedAt;
      var diffMin = Math.round(((diffMs % 86400000) % 3600000) / 60000);

      if(diffMin >= 5) {
        $scope.scrollTop();
        $scope.doRefresh(LOADING_MODE.resume);
      }
    });
    
    $scope.$on('onTap', function() {
      $scope.doRefresh(LOADING_MODE.resume);
    });
    
    $scope.$on('onUnsubscribe', function(event, data) {
      _.map($scope.viewOptions.items, function(post) {
        if(post.from.facebook_id === data.page_id) {
          post.from.is_subscribed = false;
        }
        return post;
      });
    });
    
    $scope.$on('post_unsaved', function(event, data) {
      if(data.post_id) {
        // _.remove($scope.viewOptions.items, function(post) {
        //   return post.id === data.post_id;
        // });
      }
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