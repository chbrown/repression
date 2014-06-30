/*jslint browser: true */ /*globals _, angular */

var app = angular.module('app', [
  'ngStorage',
  'misc-js/angular-plugins',
]);

app.controller('indexCtrl', function($scope, $localStorage) {
  $scope.$storage = $localStorage.$default({days: 7});

  $scope.$watch('$storage.days', function() {
    var ms = parseInt($scope.$storage.days, 10) * 86400 * 1000;
    $scope.expires = new Date(new Date().getTime() + ms);
  });
});
