/* global ionic */

angular.module( 'shopnow.controllers.offers', ['shopnow.controllers.base'] )

.controller('OffersCtrl', [
  '$scope',
  '$controller',
  'moment',
  function ($scope, $controller, moment) {
    $controller('BaseController', {$scope: $scope}); 

    $scope.prepareView = function(mode) {
      var now = moment(new Date());
      var group = 0;
      
      // console.log('OFFERS', dataset.offers);
      // #42A5F5 #424242 #FF4081 #F56991 #FFC48C #D1F2A5 #212121
      
      // dataset.offers = {data: [
      //   {
      //     facebook_id: '96838814738',
      //     name: 'Pull & Bear',
      //     is_subscribed: true,
      //     insights: {
      //       targeted_offers: 1
      //     },
      //     offers: {
      //       data: [
      //         {
      //           badge: '30% OFF',
      //           badge_color: '#FF4081'
      //         }              
      //       ]
      //     }
      //   },
      //   {
      //     facebook_id: '89127823540',
      //     name: 'River Island',
      //     is_subscribed: true,
      //     insights: {
      //       targeted_offers: 1
      //     },
      //     offers: {
      //       data: [
      //         {
      //           badge: 'SALE',
      //           badge_color: '#FFC48C'
      //         }              
      //       ]
      //     }
      //   },
      //   {
      //     facebook_id: '54185757622',
      //     name: 'Scotch & Soda',
      //     is_subscribed: true,
      //     insights: {
      //       targeted_offers: 1
      //     },
      //     offers: {
      //       data: [
      //         {
      //           badge: '10% OFF',
      //           badge_color: '#FF4081'
      //         }              
      //       ]
      //     }
      //   },
      //   {
      //     facebook_id: '29575415534',
      //     name: 'Superdry',
      //     is_subscribed: true,
      //     insights: {
      //       targeted_offers: 1
      //     },
      //     offers: {
      //       data: [
      //         {
      //           badge: 'SALE',
      //           badge_color: '#FFC48C'
      //         }              
      //       ]
      //     }
      //   },
      //   {
      //     facebook_id: '25297200265',
      //     name: 'Vans',
      //     is_subscribed: true,
      //     insights: {
      //       targeted_offers: 1
      //     },
      //     offers: {
      //       data: [
      //         {
      //           badge: 'SALE',
      //           badge_color: '#FFC48C'
      //         }              
      //       ]
      //     }
      //   },        
      //   {
      //     facebook_id: '261922123864060',
      //     name: 'Weekday',
      //     is_subscribed: true,
      //     insights: {
      //       targeted_offers: 1
      //     },
      //     offers: {
      //       data: [
      //         {
      //           badge: '25% OFF',
      //           badge_color: '#FF4081'
      //         }              
      //       ]
      //     }
      //   }, 
      //   {
      //     facebook_id: '116097341519',
      //     name: 'Hugo Boss',
      //     is_subscribed: true,
      //     insights: {
      //       targeted_offers: 1
      //     },
      //     offers: {
      //       data: [
      //         {
      //           badge: 'SALE',
      //           badge_color: '#FFC48C'
      //         }              
      //       ]
      //     }
      //   }, 
      //   {
      //     facebook_id: '624954570904450',
      //     name: 'Levi\'s',
      //     is_subscribed: true,
      //     insights: {
      //       targeted_offers: 1
      //     },
      //     offers: {
      //       data: [
      //         {
      //           badge: '40% OFF',
      //           badge_color: '#FF4081'
      //         }              
      //       ]
      //     }
      //   }, 
      //   {
      //     facebook_id: '15087023444',
      //     name: 'Nike',
      //     is_subscribed: true,
      //     insights: {
      //       targeted_offers: 1
      //     },
      //     offers: {
      //       data: [
      //         {
      //           badge: '30% OFF',
      //           badge_color: '#FF4081'
      //         }              
      //       ]
      //     }
      //   }, 
      //   {
      //     facebook_id: '135861299921981',
      //     name: 'Ralph Lauren',
      //     is_subscribed: true,
      //     insights: {
      //       targeted_offers: 1
      //     },
      //     offers: {
      //       data: [
      //         {
      //           badge: 'SALE',
      //           badge_color: '#FFC48C'
      //         }              
      //       ]
      //     }
      //   }, 
      //   {
      //     facebook_id: '15087023444',
      //     name: 'Nike',
      //     is_subscribed: true,
      //     insights: {
      //       targeted_offers: 1
      //     },
      //     offers: {
      //       data: [
      //         {
      //           badge: 'NEW COLLECTION',
      //           badge_color: '#212121'
      //         }              
      //       ]
      //     }
      //   }
      // ], total: 11};
      
      // $scope.viewOptions.items = _.shuffle(dataset.offers.data);
      $scope.viewOptions.items = dataset.offers.data;
      $scope.viewOptions.total = dataset.offers.total;
              
      $scope.isFetched();
    };
    
    $scope.display = function(mode) {
      $scope.isFetching();
      $scope.setBadgeCounter(0);
      
      $scope.getOffers(mode).then(function() {
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
          $scope.trackView('Offers');
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