/* global ionic */

angular.module( 'shopnow.controllers.search', ['shopnow.controllers.base'] )

.controller('SearchCtrl', [
  '$scope',
  '$controller', 
  'API',
  'APIQ',
  function ($scope, $controller, API, APIQ) {
    $controller('BaseController', {$scope: $scope});

    $scope.isFetched();

    var pendingSearchRequest = null;
    var currentQuery = null;

    $scope.doSearch = function() {
      $scope.isFetching();
      if(currentQuery) {
        currentQuery.$cancelRequest();
      }
      currentQuery = APIQ({endpoint: '/brands/enabled'}).query({
        q: $scope.search.value, 
      }, function(result) {
        if(!result.error) {
          $scope.viewOptions.items = result.data;
        } else {
          $scope.viewOptions.items = [];
        }
        $scope.isFetched();
      });
    };
            
    $scope.doSearchOld = function() {
      if (pendingSearchRequest) {
        pendingSearchRequest.abort();
        cancelSearch = true;
      }
      if($scope.search.value && $scope.search.value.length >= 2) {
        $scope.isFetching();
        pendingSearchRequest = API.Page.search({q: $scope.search.value});
        pendingSearchRequest
          .then(function(pages) {
            $scope.viewOptions.items = pages.data;
            $scope.isFetched();
            cancelSearch = false;
          })
          .catch(function() {
            $scope.isFetched();
          });
      } else {
        $scope.viewOptions.items = null;
        $scope.isFetched();
        cancelSearch = true;
      }
    };
        
    $scope.doRefresh = function(mode) {
      $scope.viewOptions.loading_mode = mode;
      
      if($scope.isOffline) {
        $scope.isFetched();
        return;
      }
      
      switch(mode) {
        case LOADING_MODE.init:
          $scope.trackView('Search');
          $scope.initSearch();
          break;
        case LOADING_MODE.tap:
          break;
        case LOADING_MODE.ptr:
          $scope.doSearch();
          break;
        case LOADING_MODE.more:
          break;
        case LOADING_MODE.resume:
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