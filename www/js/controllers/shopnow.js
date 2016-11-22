/* global ionic */
angular.module( 'shopnow.controllers.shopnow', [] )

.controller('ShopNowCtrl', [
	'$scope', 
	'$controller', 
	function ($scope, $controller) {
		$controller('BaseController', {$scope: $scope});

		// $scope.initTapOnHeader();		
	}
])
