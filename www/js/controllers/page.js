/* global ionic */
angular.module( 'shopnow.controllers.page', [] )

.controller('PageCtrl', [
  '$rootScope',
  '$scope', 
  '$state',
  '$controller', 
  '$ionicModal', 
  '$q', 
  '$stateParams', 
  '$filter', 
  '$ionicNavBarDelegate',
  'API', 
  'DataService', 
  'UI', 
  'PageHeaderService',
  function ($rootScope, $scope, $state, $controller, $ionicModal, $q, $stateParams, $filter, $ionicNavBarDelegate, API, DataService, UI, PageHeaderService) {
    $ionicNavBarDelegate.showBackButton(true)
   
    $controller('BaseController', {$scope: $scope});
    
    $scope.page = $stateParams.page ? $stateParams.page : $scope.page;

    $scope.ctaButtonRender = function() {
      if(!$scope.page.is_subscribed) {
        $scope.ctaTitle = 'Subscribe';
        $scope.ctaClass = 'button-more';
        $scope.ctaActionType = 'subscribe';
      } else if($scope.page.insights && $scope.page.insights.targeted_offers) {
        $scope.ctaTitle = 'Open ' + ($scope.page.insights.targeted_offers === 1 ? ' offer' : ' offers');
        $scope.ctaClass = 'button-more-email';
        $scope.ctaActionType = 'open';
      } else {
        $scope.ctaTitle = 'Go to Website';
        $scope.ctaClass = 'button-more-email';
        $scope.ctaActionType = 'goto';
      }      
    };
    
    $scope.ctaAction = function(action) {
      switch($scope.ctaActionType) {
        case 'open':
          PageHeaderService.openModalOffers($scope.page);
          break;
        case 'subscribe':
          PageHeaderService.subscribe($scope.page);
          break;
        case 'ask':
          PageHeaderService.getDiscount($scope.page);
          break;
        case 'goto':
          PageHeaderService.gotoWebsite($scope.page);
          break;
        default:
          PageHeaderService.gotoWebsite($scope.page);
      }
    };
    
    $scope.gotoWebsite = function() {
			PageHeaderService.gotoWebsite($scope.page);      
    };

    $scope.showActions = function() {
      PageHeaderService.showActions($scope.page);  
    };

    $scope.doRefresh = function(mode) {
      $scope.viewOptions.loading_mode = mode;
      
      $scope.isFetching();
      
      API.Insight.log('page;' + $scope.page.facebook_id + ';open');
      API.User.unsharePage($scope.page.facebook_id).then(function() {});
        
      var getPage = API.Page.getPage($scope.page.facebook_id);
      var getPosts = API.Page.feed([$scope.page.facebook_id], 30, 30);
      
      $q.all([getPage, getPosts]).then(function(result) {
        return {page: result[0].data, posts: result[1].posts}//, offers: result[2].data
      }).then(function(result) {
        $scope.ctaButtonRender();
  
        if(result.page.offers) {
          $scope.page.offers = result.page.offers;
          var offersIds = [];
          offersIds = _.map(result.page.offers.data, function(offer) {
            return offer.post_id;
          }, []);
        }
        
        if(result.posts.length) {
          var temp_posts = _.filter(result.posts, function(post) {
            return offersIds.indexOf(post.id) === -1 && post.message;
          });
          $scope.viewOptions.items = $filter('orderBy')(temp_posts, 'created_time', true);
        }
  
        $scope.isFetched();
      }).catch(function(err) {
        $scope.isFetched();
      });          
    };  
    
    $scope.init = function() {
      $scope.trackView('Brand_' + $scope.page.facebook_id);
      $scope.ctaButtonRender();
      $scope.doRefresh(LOADING_MODE.init);
    };

    $scope.$watch('page', function() {
      $scope.ctaButtonRender();
    }, true);
        
    $scope.$on( "$ionicView.enter", function( scopes, states ) {
      $scope.init();
    });
  }
])