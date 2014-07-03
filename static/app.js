/*jslint browser: true */ /*globals _, angular */

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
    .state('results', {
      url: '/repression/results',
      templateUrl: '/repression/static/templates/results.html',
    });

  $locationProvider.html5Mode(true);
});


app.controller('installCtrl', function($scope, $localStorage) {
  $scope.$storage = $localStorage.$default({days: 7});

  $scope.$watch('$storage.days', function() {
    var ms = parseInt($scope.$storage.days, 10) * 86400 * 1000;
    $scope.expires = new Date(new Date().getTime() + ms);
  });
});

app.controller('resultsCtrl', function($scope, $localStorage, $http, $q) {
  $scope.$storage = $localStorage.$default({days: 7});


  var refresh = function() {
    $http({
      url: '/repression/users.json',
      params: {username: $scope.$storage.username},
    }).then(function(res) {
      $scope.user = res.data[0];
      return $scope.user ? $scope.user : $q.reject(new Error('No user found'));
    }, function(res) {
      return $q.reject(new Error(res.statusText));
    }).then(function(user) {
      return $http({
        url: '/repression/users/' + user.id + '/posts.json',
      }).then(function(res) {
        $scope.total = res.data.count;
        $scope.posts = res.data.posts.map(function(post) {
          post.html = post.content;
          if (post.repressed) {
            post.html = post.html.replace(post.repressed, '<b>' + post.repressed + '</b>');
          }
          return post;
        });
      }, function(res) {
        return $q.reject(res.statusText);
      });
    }, function(err) {
      console.error(err);
    });
  };

  $scope.$watch('$storage.username', refresh);

});
