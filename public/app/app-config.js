dorrbell.config(function($stateProvider, $urlRouterProvider, $locationProvider, $mdThemingProvider, $httpProvider) {
  //
  // For any unmatched url, redirect to /state1
  $urlRouterProvider.otherwise("/home");
  // use the HTML5 History API
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });

  $httpProvider.defaults.useXDomain = true;

  var dorrbellBlue = $mdThemingProvider.extendPalette('blue', {
    '500' : '1dc2e9',
    '600' : '0f6175',
    '400' : 'a5e7f6'
  });

  var dorrbellAccent = $mdThemingProvider.extendPalette('pink', {
   '600': 'bf264d',
   '500' : 'ff3366',
   '400' : 'ffadc2'
  });
  $mdThemingProvider.definePalette('dorrbell-accent', dorrbellAccent);
  $mdThemingProvider.definePalette('dorrbell-blue', dorrbellBlue);
  $mdThemingProvider.theme('default')
    .primaryPalette('dorrbell-blue', {
      'default' : '500'
    })
    .accentPalette('dorrbell-accent', {
      'default' : '500'
    });

  //
  // Now set up the states
  $stateProvider
    .state('home', {
      url: "/home",
      templateUrl: "app/templates/home.html",
      controller: "HomeController"
    })
    .state('register', {
      url : "/register",
      templateUrl: "app/templates/register.html",
      controller : "RegisterController"
    })
});
