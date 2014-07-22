/*jslint browser: true */ /*globals _, angular, chrome */

var app = angular.module('app', [
  'ngSanitize',
  'ngStorage',
  'ui.router',
  'misc-js/angular-plugins',
]);

app.config(function($stateProvider, $urlRouterProvider, $locationProvider) {
  $urlRouterProvider.otherwise('/repression/install');

  $stateProvider
    .state('install', {
      url: '/repression/install',
      templateUrl: '/repression/static/templates/install.html',
    })
    .state('users', {
      url: '/repression/users',
      templateUrl: '/repression/static/templates/users.html',
    })
    .state('survey', {
      url: '/repression/survey',
      templateUrl: '/repression/static/templates/survey.html',
    })
    .state('results', {
      url: '/repression/results',
      templateUrl: '/repression/static/templates/results.html',
    });

  $locationProvider.html5Mode(true);
});


app.controller('installCtrl', function($scope, $localStorage) {
  // one week from now:
  $scope.expires = new Date(new Date().getTime() + (7 * 86400 * 1000));
  var webstore_ID = 'hmfpcpkjkhfegmageccfkekcdbfdffdn';

  $scope.chrome_webstore_url = document.querySelector('link[rel=chrome-webstore-item]').href;

  $scope.install = function() {
    console.log('Installing from url: %s', $scope.chrome_webstore_url);

    if (typeof chrome !== 'undefined') {
      chrome.webstore.install($scope.chrome_webstore_url, function() {
        $scope.$apply(function() {
          $scope.install_result = 'Successfully installed!';
        });
      }, function(err) {
        $scope.$apply(function() {
          $scope.install_result = 'Failed to install! ' + err.toString();
        });
      });
    } else {
      $scope.install_result = 'This extension only works in Chrome, please open this page in Chrome to install.';
    }

  };
});

app.controller('resultsCtrl', function($scope, $http, $q) {
  var refresh = function() {
    $http({
      url: '/repression/results.json',
    }).then(function(res) {
      $scope.user = res.data.user;
      $scope.total = res.data.count;
      $scope.posts = res.data.posts.map(function(post) {
        post.html = post.content;
        if (post.repressed) {
          post.html = post.html.replace(post.repressed, '<b>' + post.repressed + '</b>');
        }
        return post;
      });
    }, function(res) {
      return $q.reject(new Error(res.statusText));
    });
  };

  $scope.$watch('$storage.username', refresh);
});

app.controller('usersCtrl', function($scope, $http, $q) {
  $http({
    url: '/repression/admin/users.json',
  }).then(function(res) {
    $scope.users = res.data;
  }, function(res) {
    return $q.reject(new Error(res.statusText));
  });
});

app.controller('surveyCtrl', function($scope, $http, $q) {
  $scope.submit = function(ev) {
    ev.preventDefault();

    $scope.submitted = true;

    $http({
      method: 'POST',
      url: '/repression/survey.json',
      data: {repress: $scope.repress},
    }).then(function(res) {
      $scope.completed = true;
      $scope.users = res.data;
    }, function(res) {
      alert(new Error(res.statusText).toString());
    });
  };

});
