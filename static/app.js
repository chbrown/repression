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

app.controller('resultsCtrl', function($scope, $localStorage, $http) {
  $scope.$storage = $localStorage.$default({days: 7});

  $scope.$watch('$storage.username', function() {
    $http({
      url: '/repression/results.json',
      params: {username: $scope.$storage.username},
    }).then(function(res) {
      // console.log('Got', res);
      $scope.posts = res.data.map(function(post) {
        post.html = post.content.replace(post.match, '<b>' + post.match + '</b>');
        return post;
      });
    }, function(res) {
      console.error('Error getting results');
    });
  });
});
