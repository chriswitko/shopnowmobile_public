/* global datasetPages */
angular.module( 'shopnow.directives', [] )

.directive('squareImg', [function () {
  return {
    restrict: 'EA',
    scope: {
      src: '=',
      width: '='
    },
    link: function (scope, iElement, iAttrs) {
      iElement.css('background', 'url(' + (scope.src || 'https://placehold.it/640x640') + ') no-repeat 50% 50%');
      iElement.css('background-size', 'cover');
      iElement.css('width', scope.width ? (scope.width + 'px') : '100%');
      iElement.css('height', iElement[0].offsetWidth + 'px');
    }
  };
}])

.directive('originalImg', [function ($timeout) {
  return {
    restrict: 'EA',
    scope: {
      src: '@'
    },
    link: function (scope, iElement, iAttrs) {
      scope.$watch('src', function() {
        var img = new Image();
        img.src = scope.src;
        img.onload = function() {
          var i_width = img.width;
          var i_height = img.height;
          var e_width = iElement[0].offsetWidth;
          var w_ratio = 100 / (i_width / e_width);
          var n_height = i_height * (w_ratio / 100);
          if(n_height > e_width) {
            n_height = e_width;
          }
          iElement.css('background', 'url(' + (scope.src || 'https://placehold.it/640x640') + ') no-repeat 50% 50%');
          iElement.css('background-size', 'cover');
          iElement.css('width', scope.width ? (scope.width + 'px') : '100%');
          iElement.css('height', n_height + 'px');
        };
      });
    }
  };
}])

.directive('wideImg', ['$window', function ($window) {
  return {
    restrict: 'EA',
    scope: {
        src: '=',
        width: '=',
    },
    link: function (scope, iElement, iAttrs) {
      iElement.css('background', 'url(' + (scope.src || 'https://placehold.it/640x640') + ') no-repeat 50% 50%');
      iElement.css('background-size', 'cover');
      var baseWidth = 750;
      var baseHeight = 300;
      var width = $window.innerWidth;
      var pixel = (((width * 100) / baseWidth) / 100);
      var height = Math.ceil(baseHeight - (baseHeight * pixel));
      if(height <= 0) {
        height = baseHeight;
      }
      if(scope.width) {
        iElement.css('width', scope.width);
      } else {
        iElement.css('width', '100%');
      }
      iElement.css('height', height + 'px');
    }
  };
}])

.directive('postsList', function() {
  return {
    restrict: 'EA',
    scope: {
      posts: '=',
      followLink: '=?',
      isCompactMode: '=?'
    },
    templateUrl: 'templates/component.posts.list.html'
  }
})

.directive('pagesList', function() {
  return {
    restrict: 'EA',
    scope: {
      suggested: '=',
      following: '=',
      foryou: '=',
      showSearch: '=?',
      searchResults: '=',
      search: '='
    },
    templateUrl: 'templates/component.pages.list.html'
  }
})

.directive( 'snPost', function() {
  return {
    restrict: 'EA',
    scope: {
      post: '=',
      stateName: '@',
      isCompactMode: '=?',
      followLink: '=?'
    },
    templateUrl: 'templates/component.post.html',
    link: function(scope) {
      if(current_user.saved.data.indexOf(scope.post.id) > -1) {
        scope.post.is_saved = true;
      } else {
        scope.post.is_saved = false;
      }
    },
    controller: ['$scope', '$rootScope', 'API', function($scope, $rootScope, API) {
      $scope.onClick = function() {
        API.Link.goto({obj_name: 'post', obj_id: $scope.post.id});
      };
      
      $scope.saveUnsave = function() {
        if($scope.post.is_saved) {
          $scope.unsave();
        } else {
          $scope.save();
        }
      };
      
      $scope.save = function() {
        API.Post.save($scope.post.id);
        if(!('saved' in current_user)) {
          current_user['saved'] = {data: []};
        }
        current_user.saved.data.push($scope.post.id);
        $scope.post.is_saved = true
      };
           
      $scope.unsave = function() {
        API.Post.unsave($scope.post.id);
        current_user.saved = current_user.saved && current_user.saved.data ? current_user.saved : [];
        // current_user.saved.data.splice(current_user.saved.data.indexOf($scope.post.id), 1);
        $scope.post.is_saved = false
        $rootScope.$broadcast('post_unsaved', {post_id: $scope.post.id});
      };     
    }]
  };
})

.directive( 'snPageHeader', [function() {
  return {
    restrict: 'EA',
    scope: {
      page: '=',
      offer: '=',
      showClean: '@',
      stateName: '@',
      isCompactMode: '=?',
      followLink: '=?',
      isLoading: '=?',
      unshareAction: '=?',
      showOffersOnly: '=?',
      showCta: '=?',
      helpLineText: '@',
      btnText: '@',
      message: '='
    },
    templateUrl: 'templates/component.page.header.html',
    link: function(scope) {
      if(current_user.subscribed_pages.data.indexOf(scope.page.facebook_id) > -1) {
        scope.page.is_subscribed = true;
      } else {
        scope.page.is_subscribed = false;
      }
    },
    controller: ['$scope', '$rootScope', '$state', '$ionicScrollDelegate', '$ionicActionSheet', '$ionicHistory', '$ionicLoading', '$ionicModal', '$cordovaSocialSharing', '$ionicPopup', 'DataService', 'API', 'UI', 'PageHeaderService', function($scope, $rootScope, $state, $ionicScrollDelegate, $ionicActionSheet, $ionicHistory, $ionicLoading, $ionicModal, $cordovaSocialSharing, $ionicPopup, DataService, API, UI, PageHeaderService) {
      $scope.showActions = function() {
        PageHeaderService.showActions($scope.page);  
      };
      
      $scope.subscribe = function() {
        PageHeaderService.subscribe($scope.page);
      };
 
      $scope.onClick = function(stateName, page) {
        if(!$rootScope.isInternetError) {
          if($scope.followLink && stateName !== 'shopnow.offers.preview') {
            $state.go(stateName, {pageID: $scope.page.facebook_id, page: $scope.page}, {reload: true, inherit: true, notify: true});
          } else {
            PageHeaderService.openModalOffers($scope.page);
          }
        } else {
          UI.showAlert({text: 'Internet connection is not available', bannerType: 'error'});
        }
      };      
    }]
  };
}])

.directive('snUserHeader', function() {
  return {
    restrict: 'EA',
    scope: {
      user: '=',
      myClick: '&',
      showAction: '=?'
    },
    templateUrl: 'templates/component.user.header.html',
    controller: ['$scope', function($scope) {
      $scope.onInternalClick = function(user_id) {
        $scope.myClick();
      };
    }]
  };
})

.directive('ionSearchBar', ['$rootScope', '$ionicScrollDelegate', function($rootScope, $ionicScrollDelegate) {
  return {
    restrict: 'E',
    replace: true,
    scope: { search: '=?filter', hello: '&' },
    link: function(scope, element, attrs) {
      scope.placeholder = attrs.placeholder || '';
      scope.search = {value: '', focus: false};
      if (attrs.class) {
        element.addClass(attrs.class);
      }

      // We need the actual input field to detect focus and blur
      var inputElement = element.find('input')[0];

      // This function is triggered when the user presses the `Cancel` button
      scope.cancelSearch = function() {
        scope.search.value = '';
        scope.search.focus = false;
        element.removeClass('search-bar-focused');
        angular.element(document.querySelector('.has-search-bar')).removeClass('search-bar-focused');
        $rootScope.$broadcast('onHideSearch');
      };

      // When the user focuses the search bar
      angular.element(inputElement).bind('focus', function () {
        scope.search.focus = true;
        $rootScope.$broadcast('onShowSearch');
        element.addClass('search-bar-focused');
        angular.element(document.querySelector('.has-search-bar')).addClass('search-bar-focused');
        scope.$digest();
      });
    },
    template: '<div class="search-bar bar bar-header item-input-inset">' +
                '<label class="item-input-wrapper">' +
                  '<i class="icon ion-ios-search placeholder-icon"></i>' +
                  '<input id="searchBox" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" type="search" placeholder="{{placeholder}}" ng-model="search.value" ng-change="hello()">' +
                '</label>' +
                '<button class="button button-clear button-positive button-search" ng-if="search.focus && search.value.length" ng-click="cancelSearch()" ng-bind="search.focus && search.value.length ? (search.value.length ? \'Clear\' : \'Search\') : \'Search\'">' +
                  '' +
                '</button>' +
              '</div>'
  };
}])

.directive('imageonload', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.bind('load', function() {
                // element.addClass('')
            });
            element.bind('error', function(){
                // alert('image could not be loaded');
            });
        }
    };
})

.directive( 'emptySpace', function() {
  return {
    restrict: 'EA',
    scope: {
      viewOptions: '=',
      icon: '@',
      title: '@',
      message: '@'
    },
    templateUrl: 'templates/component.empty.space.html',
    controller: ['$scope', function($scope) {
      $scope.VIEW_MODE = VIEW_MODE;
      $scope.LOADING_MODE = LOADING_MODE;
      $scope.DATA_LOAD_STATE = DATA_LOAD_STATE;
    }]
  };
})

.directive( 'progressBar', function() {
  return {
    restrict: 'EA',
    scope: {
      viewOptions: '=',
      message: '@'
    },
    templateUrl: 'templates/component.progress.bar.html',
    controller: ['$scope', function($scope) {
      $scope.VIEW_MODE = VIEW_MODE;
      $scope.LOADING_MODE = LOADING_MODE;
      $scope.DATA_LOAD_STATE = DATA_LOAD_STATE;
    }]
  };
})

.directive( 'buttonMore', function() {
  return {
    restrict: 'EA',
    scope: {
      viewOptions: '=',
      onClick: '&'
    },
    templateUrl: 'templates/component.button.more.html',
    controller: ['$scope', function($scope) {
      var total_items = 0;
      var copy_items = [];
     
      $scope.isEnabled = true;
      $scope.VIEW_MODE = VIEW_MODE;
      $scope.LOADING_MODE = LOADING_MODE;
      $scope.DATA_LOAD_STATE = DATA_LOAD_STATE;

      $scope.$on('Cordova.NetworkStatus.Offline', function() {
        $scope.isOffline = true;
      });     
      
      $scope.$on('Cordova.NetworkStatus.Online', function() {
        $scope.isOffline = false;
      });
      
      $scope.doMore = function() {
        copy_items = angular.copy($scope.viewOptions.items);

        if(copy_items.length === total_items) {
          $scope.isEnabled = false;  
        } else {
          $scope.isEnabled = true;  
        }
        
        total_items = $scope.viewOptions.items.length;

        $scope.onClick();
      };
    }]
  };
})

.directive( 'snIntroBox', function() {
  return {
    restrict: 'EA',
    scope: {
      text: '@',
      title: '@',
      id: '@'
    },
    templateUrl: 'templates/component.intro.box.html',
    controller: ['$scope', '$element', 'DataService', function($scope, $element, DataService) {
      $scope.setHide = function() {
        var data = [];
            data['isHidden-' + $scope.id] = true;
        DataService.updateMe(data, function() {});
      };
      
      if(current_user) {
        $scope.isHidden = current_user['isHidden-' + $scope.id] ? true : false; 
      }
      if($scope.isHidden) {
        $element.remove();
      }
    }],
    link: function (scope, element, attrs) {
      scope.hide = function() {
        scope.setHide();
        element.remove();
      };
    }
  };
})

.directive('hscroller', ['$timeout', function($timeout) {
  return {
    restrict: 'E',
    template: '<div class="hscroller" style="min-width:100%" ng-transclude></div>',
    replace: true,
    transclude: true,
    compile: function(element, attr) {
      return function($scope, $element, $attr) {
      }
    },
  }
}])

.directive('hcard', ['$rootScope', '$compile', '$state', function($rootScope, $compile, $state) {
  return {
    restrict: 'E',
    template: '<div class="hscroller-card" ng-transclude></div>',
    replace: true,
    transclude: true,
    scope: {
      page: '=',
      desc: '@',
      image: '@',
      index: '@'
    },
    link: function(scope, element, attrs){
      var img = angular.element("<div style='border-radius:5px;background-size:cover!important;background:url(" + (attrs.image|| 'https://placehold.it/640x640') + ") no-repeat 50% 50%' class='full-image hscroller-img'></div>");
      img.bind('click', function() {
        $state.go('preview.page', {pageID: attrs.url, page: scope.page});
      });
      element.append(img);
      element.append('<div class="hscroller-label">'+attrs.desc+'</div>');
      var animationClass = 'hscroller-card-animated-' + attrs.index.toString();
      element.addClass(animationClass);
    },
  }
}])

.directive('logEvent', ['API', function(API) {
  return function(scope, element, attrs) {
    var clickingCallback = function() {
      API.Insight.log(attrs.logEvent);
    };
    element.bind('click', clickingCallback);
  }
}])

