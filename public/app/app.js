var dorrbell = angular.module('dorrbell', ['ui.router', 'ngMaterial', 'ngRaven']);

dorrbell.run(function($rootScope, $window) {
  $rootScope.$on('$stateChangeStart',
    function(event, toState, toParams, fromState, fromParams) {
      if (toState.external) {
        event.preventDefault();
        $window.location.replace(toState.externalUrl);
      }
    });
})
