/* global is_admin */
/* global current_user */
/* global facebook_token */
/* global access_token */
angular.module( 'shopnow.api', [] )

.service('Insights', function(API) {
  this.log = function(options) {
    // insights_bulk.push({n: options.n, i: options.i, e: options.e});
    return API.Insight.log({n: options.n, i: options.i, e: options.e});
  }
  
  this.synch = function(options) {
    // insights_bulk = [];
    return API.Insight.log({n: options.n, i: options.i, e: options.e});
  }
})

.service('UI', function($ionicModal, $ionicContentBanner, CONFIG) {
  this.showAlert = function(options) {
    if(contentBannerInstance) {
      contentBannerInstance();
    }
    
    var contentBannerInstance = $ionicContentBanner.show({
      text: [options.text],
      interval: 3000,
      autoClose: 10000,
      type: options.bannerType || 'info',
      transition: options.transition || 'vertical'
    });
  }
  
  this.openAboutUrl = function() {
    window.open(CONFIG.app.url + CONFIG.app.aboutUrl, '_system', 'location=no');  
  }

  this.openTermsUrl = function() {
    window.open(CONFIG.app.url + CONFIG.app.termsUrl, '_system', 'location=no');  
  }
  
  this.showConfirmation = function(options, scope) {
    scope.closeModal = function() {
      scope.modal.hide();
    };     
     
    $ionicModal.fromTemplateUrl('templates/' + options.template + '.html', {
      scope: scope,
      animation: options.animation || 'slide-in-up'
    }).then(function(modal) {
      scope.modal = modal;
      scope.modal.show();
    });
  };
})

.service('DataService', function($rootScope, $localForage, $localStorage, $q, $http, $filter, CONFIG) {
  var appStorage = $localStorage;//$localForage;

  this.getCurrentID = function(callback) {
    callback = callback || function() {};
    var currentID = '';
    if(appStorage && appStorage.currentID) {
      currentID = 'user_' + appStorage.currentID;
    }
    callback(null, currentID);
    return currentID;
    // appStorage.getItem('currentID').then(function(data) {
    //   callback(null, 'user_' + data);
    // });
  }  
  
  this.getFacebookToken = function(callback) {
    callback = callback || function() {};
    var output = appStorage[appStorage.currentID].access_token;
    callback(null, output);
    return output;
    // self.getCurrentID(function(err, key) {
    //   appStorage.getItem(key).then(function(data) {
    //     callback(null, data.access_token);
    //   });
    // });
  }

  this.getAccessToken = function(callback) {
    callback = callback || function() {};
    var output = appStorage[appStorage.currentID].app_token;
    callback(null, output);
    return output;
    // self.getCurrentID(function(err, key) {
    //   appStorage.getItem(key).then(function(data) {
    //     callback(null, data.app_token);
    //   });
    // });
  }
  
  this.getPage = function(id) {
    return _.first(_.filter(datasetPages, function(el) {
      return el.facebook_id === id;
    }));
  };
  
  this.setData = function(dataset, key, value, data) {
    _.extend(dataset[value], data);
  };  
  
  this.getMe = function(callback) {
    var dfd = $q.defer()
    var self = this;
    callback = callback || function() {};
    var output = {};
    if(this.getCurrentID() && appStorage[this.getCurrentID()] && appStorage[this.getCurrentID()].me) {
      output = appStorage[this.getCurrentID()].me
    }
    callback(null, {me: output});
    dfd.resolve({me: output});
    // self.getCurrentID(function(err, key) {
    //   appStorage.getItem(key).then(function(user) {
    //     callback(null, {me: (user ? user.me : {})});
    //     dfd.resolve({me: (user ? user.me : {})});
    //   })
    // })
    dfd.promise;
    return {me: output};
  }
  
  this.updateMe = function(data, callback) {
    var dfd = $q.defer()
    var self = this;
    callback = callback || function() {};
    var user = appStorage[this.getCurrentID()];
    appStorage[this.getCurrentID()].me = _.extend(user.me, data)
    var output = appStorage[this.getCurrentID()].me;
    callback(null, {me: output});
    dfd.resolve({me: output});
    dfd.promise;
  }
  
  this.access_token = null;
  this.facebook_token = null;
  this.current_user = null;

  this.isTokenValid = function(facebook_token) {
    var dfd = $q.defer();
    if(facebook_token && facebook_token !== CONFIG.facebook.appToken) {
      $http.get('https://graph.facebook.com/debug_token?access_token=' + CONFIG.facebook.appToken + '&input_token=' + facebook_token)
        .then(function(result) {
          dfd.resolve({status: result.data.data.is_valid, token: facebook_token});
        })
        .catch(function() {
          dfd.reject();
        });
    } else {
      dfd.resolve({status: true, token: CONFIG.facebook.appToken});
    }
    return dfd.promise;      
  }

  this.isAuthed = function(callback) {
    callback = callback || function() {};
    
    var self = this;
    var dfd = $q.defer()
    this.getMe(function(err, data) {
      if(data) {
        if(data.me) {
          access_token = data.me.app_token;
          facebook_token = data.me.access_token;
          current_user = data.me;
          if(current_user.roles && current_user.roles.data.indexOf('admin') > -1) {
            is_admin = true;
          }
          if(!current_user.is_ready) {
            callback(null, false);
            dfd.resolve(false);    
          } else {
            callback(null, true);
            dfd.resolve(true);
          }
        } else {
          callback(null, false);
          dfd.resolve(false);
        }
      } else {
        callback(null, false);
        dfd.resolve(false);
      }
      dfd.promise;
    })
  }
  
  this.filterPost = function(posts) {
    return _.filter(posts, function(post) {
      return post.type !== 'status' && post.type !== 'video';
    }, []);
  }
  
  this.appStorage = appStorage;
})

.service('API', function($q, $state, $http, $filter, $ImageCacheFactory, $ionicHistory, $ionicPopup, $window, httpi, CONFIG, ngFB, DataService, moment) {
  var self = this;
  var API_SERVER = CONFIG.api.url;
  var WEB_SERVER = CONFIG.app.url;

  var qs = function(obj, prefix){
    var str = [];
    for (var p in obj) {
      var k = prefix ? prefix + "[" + p + "]" : p,
          v = obj[p];
      if(v) str.push(angular.isObject(v) ? qs(v, k) : (k) + "=" + encodeURIComponent(v));
    }
    return str.join("&");
  }
  
  this.User = {};
  this.Page = {};
  this.Insight = {};
  this.Link = {};
  this.Post = {};
  
  this.Insight.log = function(attrs) {
    var arr = attrs.split('|');
    arr.forEach(function(data) {
      data = data.split(';');
      $http.get(API_SERVER + '/v1/api/insights?n=' + data[0] + '&i=' + data[1] + '&e=' + data[2]);
    });
  };

  this.Link.goto = function(options) {
    window.open(WEB_SERVER + '/go?obj_name=' + options.obj_name + '&obj_id=' + options.obj_id + '&access_token=' + access_token, '_system', 'location=no');         
  };  

  this.Link.redirect = function(url) {
    window.open(WEB_SERVER + '/go?url=' + url, '_system', 'location=no');         
  };  
        
  this.User.oauth = function(fb_token) {
    return $http.get(API_SERVER + '/v1/api/oauth?access_token=' + fb_token);
  };

  this.User.auth = function(user) {
    return $http.get(API_SERVER + '/v1/api/auth?email=' + user.email + '&password=' + user.password);
  };

  this.User.logout = function() {
    DataService.appStorage.currentID = null;

    $ionicHistory.clearCache();
    $ionicHistory.clearHistory();
    DataService.appStorage.$reset();
    current_user = {};
    $state.go('login', null, {reload: true, inherit: true, notify: true});
    // window.location.href = '/#/login';
  };

  this.User.logoutToResign = function() {
    var self = this;
    
    var confirmPopup = $ionicPopup.show({
      title: 'Continue with Facebook',
      template: "<p align='center' class='mb0'>To use ShopNow with Facebook you have to logout to proceed.</p>",
      buttons: [
        {
          text: 'No, thanks'
        },
        {
          class: "btn-primary",
          text: '<strong>OK</strong>',
          onTap: function(e) {
          }
        }
      ]
    });
    
    confirmPopup.then(function(res) {
      if(res) {
        DataService.appStorage.currentID = null;

        $ionicHistory.clearCache();
        $ionicHistory.clearHistory();
        $state.go('login', null, {reload: true, inherit: true, notify: true});
      } else {
      }
    });    
  };
    
  this.User.login = function() {
    var dfd = $q.defer();
    if(!DataService.getFacebookToken()) {
      dfd.resolve({status: false});
    } else {
      if(CONFIG.facebook.appToken !== DataService.getFacebookToken()) {
        $http.get('https://graph.facebook.com/debug_token?access_token=' + CONFIG.facebook.appToken + '&input_token=' + DataService.getFacebookToken()).then(function(result) {
          dfd.resolve({status: result.data.data.is_valid});
        });
      } else {
        dfd.resolve({status: true});
      }
    }
    return dfd.promise;      
  }
    
  this.User.isSignedIn = function() {
    return DataService.getAccessToken() && DataService.getCurrentID();    
  }
  
  this.User.isAdmin = function(callback) {
    callback = callback || function() {};
    return current_user.roles.data.indexOf('admin') > -1 || current_user.is_admin;
  }
  
  this.User.reset = function() {
    DataService.appStorage.clear();
    $window.localStorage.clear(); // fix
  }

  this.User.clearSearchHistory = function() {
    // DataService.clear('popular'); 
    // DataService.clear('searches'); 
  }

  this.User.token = function(fb_token) {
    return $http.get(API_SERVER + '/v1/api/exchange_token?access_token=' + fb_token);
  };

  this.User.me = function() {
    return $http.get(API_SERVER + '/v1/api/user/me?fields=facebook_id,name,first_name,last_name,gender,picture,roles,email,is_ready,is_business,count_subscriptions,access_token,enabled_notifications,is_admin,saved,subscribed_pages,requested_pages,onesignal_id&cache=-1');
  };

  this.User.synch = function() {
    return $http.get(API_SERVER + '/v1/api/user/me?fields=count_subscriptions,is_admin,saved,subscribed_pages,requested_pages');
  };
  
  this.Page.me = function(options) {
    return $http.get(API_SERVER + '/v1/api/brand/' + options.page_id + '?fields=facebook_id,username,name,link,picture,counters,is_subscribed,is_requested,offers');
  };

  function prepareResponse( request ) {
      // "Unwrap" the AJAX response.
      var promise = request.then(
          function handleResolve( response ) {
              return( response.data );
          },
          function handleReject( response ) {
              return( $q.reject( response.status ) );
          }
      );
      // Wire in the underlying abort method.
      promise.abort = request.abort;
      // No matter what happens with the request, free up the object
      // references in order to help the garbage collection.
      promise.finally(
          function handleFinally() {
              request = promise = null;
          }
      );
      return( promise );
  }

  this.Page.search = function(options) {
    // var dfdSearch = $q.defer()
    var request = httpi({method: 'GET', url: API_SERVER + '/v1/api/brands/enabled?q=' + options.q})
    // .then(function(result) {
    //   dfdSearch.resolve({data: result.data.data, total: result.data.summary});
    // })
    return( prepareResponse( request ) );
    // return dfdSearch.promise;
  };

  this.User.getAllPages = function(options) {
    var dfd = $q.defer()
    $http.get(API_SERVER + '/v1/api/user/me/subscriptions?limit=' + (options.limit ? options.limit : 40) + '&after=' + (options.after ? options.after : 1)).then(function(result) {
      if(result.data.error) {
        dfd.reject();
      } else {
        dfd.resolve({data: result.data.subscriptions.data, total: result.data.subscriptions.summary});
      }
    });
    return dfd.promise;
  };

  this.User.enableNotifications = function(options) {
    var dfd = $q.defer()
    $http.put(API_SERVER + '/v1/api/user/me/enable_notifications').then(function(result) {
      if(result.data) {
        dfd.resolve({data: result});
      } else {
        dfd.reject();
      }
    });
    return dfd.promise;
  };

  this.User.disableNotifications = function(options) {
    var dfd = $q.defer()
    $http.put(API_SERVER + '/v1/api/user/me/disable_notifications').then(function(result) {
      if(result.data) {
        dfd.resolve({data: result});
      } else {
        dfd.reject();
      }
    });
    return dfd.promise;
  };
    
  this.User.getLive = function(options) {
    var dfd = $q.defer()
    $http.get(API_SERVER + '/v1/api/user/me/subscriptions').then(function(result) {
      if(result.data) {
        dfd.resolve({data: result.data.subscriptions.data, total: result.data.subscriptions.summary});
      } else {
        dfd.reject();
      }
    });
    return dfd.promise;
  };

  this.User.getSuggested = function(options) {
    var dfd = $q.defer()
    $http.get(API_SERVER + '/v1/api/user/me/subscriptions_active').then(function(result) {
      if(result.data.subscriptions_active && result.data.subscriptions_active.data) {
        dfd.resolve({data: result.data.subscriptions_active.data, total: result.data.subscriptions_active.summary});
      } else {
        dfd.reject();
      }
    });
    return dfd.promise;
  };
  
  this.User.getForYou = function(options) {
    var dfd = $q.defer()
    $http.get(API_SERVER + '/v1/api/user/me/subscriptions_with_offers').then(function(result) {
      if(result.data.subscriptions_with_offers && result.data.subscriptions_with_offers.data) {
        dfd.resolve({data: result.data.subscriptions_with_offers.data, total: result.data.subscriptions_with_offers.summary});
      } else {
        dfd.reject();
      }
    });
    return dfd.promise;
  };  

  this.User.getSharedPages = function(options) {
    var dfd = $q.defer()
    $http.get(API_SERVER + '/v1/api/user/me/shared_subscriptions?sort=created_at').then(function(result) {
      if(result.data.shared_subscriptions && result.data.shared_subscriptions.data) {
        dfd.resolve({data: result.data.shared_subscriptions.data, total: result.data.shared_subscriptions.summary});
      } else {
        dfd.reject();
      }
    });
    return dfd.promise;
  };  

  this.User.getDiscover = function(options) {
    var dfd = $q.defer()
    $http.get(API_SERVER + '/v1/api/user/me/discover?limit=' + (options.limit ? options.limit : 20) + '&after=' + (options.after ? options.after : 1)).then(function(result) {
      if(result.data.discover && result.data.discover.data) {
        dfd.resolve({data: result.data.discover.data, total: result.data.discover.summary});
      } else {
        dfd.reject();
      }
    });
    return dfd.promise;
  };  
  
  this.User.getDiscoverLocal = function(options) {
    var dfd = $q.defer()
    if(current_user && current_user.subscribed_pages) {
      dfd.resolve({data: current_user.subscribed_pages.data.slice((options.after - 1) * options.limit, ((options.after - 1) * options.limit) + options.limit), total: current_user.subscribed_pages.data.length});
    } else {
      dfd.reject();
    }
    return dfd.promise;
  };   
    
  this.User.getStores = function(options) {
    var dfd = $q.defer()
    $http.get(API_SERVER + '/v1/api/user/me/subscriptions?sort=created_at&after=' + (options.after || 1)).then(function(result) {
      if(result.data.subscriptions && result.data.subscriptions.data) {
        dfd.resolve({data: result.data.subscriptions.data, total: result.data.subscriptions.summary});
      } else {
        dfd.reject();
      }
    });
    return dfd.promise;
  };  

  this.User.getRecommended = function(options) {
    var dfd = $q.defer()
    $http.get(API_SERVER + '/v1/api/user/me/recommended?after=1').then(function(result) {
      if(result.data.recommended && result.data.recommended.data) {
        dfd.resolve({data: result.data.recommended.data, total: result.data.recommended.summary});
      } else {
        dfd.reject();
      }
    });
    return dfd.promise;
  };  
  
  this.User.getPosts = function(options) {
    var dfd = $q.defer()
    $http.get(API_SERVER + '/v1/api/user/me/posts?sort=created_at&after=' + (options.after || 1)).then(function(result) {
      if(result.data.posts && result.data.posts.data) {
        dfd.resolve({data: result.data.posts.data, total: result.data.posts.summary});
      } else {
        dfd.reject();
      }
    });
    return dfd.promise;
  };  
  
  this.User.getPostsSuggested = function(options) {
    var dfd = $q.defer()
    $http.get(API_SERVER + '/v1/api/user/me/posts_suggestions?sort=created_at&after=' + (options.after || 1)).then(function(result) {
      if(result.data.posts_suggestions && result.data.posts_suggestions.data) {
        dfd.resolve({data: result.data.posts_suggestions.data, total: result.data.posts_suggestions.summary});
      } else {
        dfd.reject();
      }
    });
    return dfd.promise;
  };  
    
  this.User.getOffers = function(options) {
    var dfd = $q.defer()
    $http.get(API_SERVER + '/v1/api/user/me/offers').then(function(result) {
      if(result.data) {
        dfd.resolve({data: result.data.data, total: result.data.total});
      } else {
        dfd.reject();
      }
    });
    return dfd.promise;
  };
  
  this.Page.feed = function(pagesIds, days, limit) {
    var dfd = $q.defer()
    var posts = [];
    // var since = moment().add(-days, 'days').unix();
    limit = limit || 2;

    if(!facebook_token || !pagesIds.length) {
      dfd.reject('No pagesIds');
    } else {
      ngFB.api({
        path: '/posts', // 
        params: {
          fields: 'id,from.fields(id,name,website,picture),message,picture,full_picture,link,type,created_time', 
          limit: limit, 
          ids: pagesIds.join(','), 
          fbToken: facebook_token, 
          access_token: facebook_token
        }, 
        result: function(result) {
          _.map(result, function(page) {
            posts = posts.concat(page.data);
          }, []); 
          _.map(_.filter(posts, function(post) {
            return 'from' in post;
          }), function(post) {
            if(post.from) {
              post.from.facebook_id = post.from.id;
              if(post.from.picture) post.from.picture = post.from.picture.data.url;
              return post;
            }
          })
          posts = $filter('orderBy')(DataService.filterPost(posts), 'created_time', true);
            
          dfd.resolve({posts: posts});
        }, 
        error: function(err) {
          dfd.reject(err);
        }
      });      
    }
    
    return dfd.promise;
  };

  this.Page.newsfeed = function(pagesIds, days, limit) {
    var dfd = $q.defer()
    var posts = [];
    var since = moment().add(-days, 'days').unix();
    limit = limit || 2;

    if(!facebook_token || !pagesIds.length) {
      dfd.reject('No pagesIds');
    } else {
      ngFB.api({
        path: '/', // 
        params: {
          fields: 'id,from.fields(id,name,website,picture),message,picture,full_picture,link,type,created_time', 
          limit: limit,
          since: since, 
          ids: pagesIds.join(','), 
          fbToken: facebook_token, 
          access_token: facebook_token
        }, 
        result: function(result) {
          // console.log('result', result);
          _.map(result, function(post) {
            posts = posts.concat(post);
          }, []); 
          _.map(_.filter(posts, function(post) {
            return 'from' in post;
          }), function(post) {
            if(post.from) {
              post.from.facebook_id = post.from.id;
              if(post.from.picture) post.from.picture = post.from.picture.data.url;
              return post;
            }
          })
          posts = $filter('orderBy')(DataService.filterPost(posts), 'created_time', true);
            
          dfd.resolve({posts: posts});
        }, 
        error: function(err) {
          dfd.reject(err);
        }
      });      
    }
    
    return dfd.promise;
  };
  
  this.User.refreshPermissions = function(callback) {
    callback = callback || function() {};
    if(facebook_token) {
      ngFB.login({auth_type: 'rerequest', scope: 'email,user_likes,user_friends,user_birthday'})
        .then(function (response) {
          if (response.status === 'connected') {
              self.User.oauth(response.authResponse.accessToken)
                .success(function(token) {
                  facebook_token = response.authResponse.accessToken;
                  self.User.me()
                    .success(function(updated_me) {
                      if(updated_me && updated_me.facebook_id) {
                        facebook_token = updated_me.access_token;
                        var data = [];
                            data['access_token'] = facebook_token;
                        DataService.updateMe(data, function() {
                          callback();
                        });
                      }
                    })
                })
          }
        })
        .catch(function() {
          callback();
        });
    } else {
      self.User.logoutToResign();
    }
  };

  this.User.friends = function(pagesIds) {
    var dfd = $q.defer()
    if(!facebook_token) {
      dfd.reject('No FB token');
    } else {
      ngFB.api({
        path: '/me/friends', 
        params: {fields: 'id,name,picture,link', limit: 100, access_token: facebook_token}, 
        result: function(result) {
          dfd.resolve(result);
        }, 
        error: function(err) {
          dfd.reject(err);
        }
      });
    }
    return dfd.promise;
  };

  this.Post.unsave = function(post_id) {
    return $http.get(API_SERVER + '/v1/api/user/me/unsave_post?post_id=' + post_id);
  };
  
  this.Post.save = function(post_id) {
    return $http.get(API_SERVER + '/v1/api/user/me/save_post?post_id=' + post_id);
  };

  
  this.Post.feed = function(postsIds, days, limit) {
    var dfd = $q.defer()
    var posts = [];
    var since = moment().add(-days, 'days').unix();
    limit = limit || 2;

    if(!facebook_token || !postsIds.length) {
      dfd.reject('No postsIds');
    } else {
      ngFB.api({
        path: '/', // 
        params: {fields: 'id,from.fields(id,name,website,picture),message,picture,full_picture,link,type,created_time', since: since, limit: limit, ids: postsIds.join(','), fbToken: facebook_token, access_token: facebook_token}, 
        result: function(result) {
          _.map(result, function(post) {
            posts = posts.concat(post);
          }, []);
          posts = _.filter(posts, function(post) {
            return 'from' in post;
          });
          posts = _.map(posts, function(post) {
            if(post.from) {
              post.from.facebook_id = post.from.id;
              if(post.from.picture) post.from.picture = post.from.picture.data.url;
              return post;
            }
          })
            
          dfd.resolve({posts: posts});
        }, 
        error: function(err) {
          dfd.resolve({posts: []});
        }
      });      
    }
    
    return dfd.promise;
  };
  
  this.User.unsharePage = function(page_id) {
    return $http.get(API_SERVER + '/v1/api/user/me/unshare_page?page_id=' + page_id);
  };
  
  this.User.sharePage = function(friend_id, page) {
    return $http.get(API_SERVER + '/v1/api/user/' + friend_id + '/share_page?page_id=' + page.facebook_id + '&page_name=' + page.name);
  };
    
  this.User.registerDevice = function(token, onesignal_id) {
    return $http.get(API_SERVER + '/v1/api/user/me/register_device?token=' + token + '&platform=' + ionic.Platform.platform() + '&onesignal_id=' + onesignal_id);
  };
  
  this.Page.subscribe = function(pageID) {
    return $http.get(API_SERVER + '/v1/api/user/me/add_subscription?page_id=' + pageID);
  };
  
  this.Page.unsubscribe = function(pageID) {
    return $http.get(API_SERVER + '/v1/api/user/me/remove_subscription?page_id=' + pageID);
  };
  
  this.Page.request = function(pageID) {
    return $http.get(API_SERVER + '/v1/api/user/me/ask_for_discount?page_id=' + pageID);
  };

  this.Page.getPage = function(pageID) {
    return $http.get(API_SERVER + '/v1/api/brand/' + pageID + '?fields=facebook_id,username,name,link,picture,counters,is_subscribed,is_requested,offers');
  };
})