dorrbell.config(function($stateProvider, $urlRouterProvider, $locationProvider, $mdThemingProvider, $httpProvider) {
  //Constants

  // For any unmatched url, redirect to /state1
  $urlRouterProvider.otherwise("/");
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
  $mdThemingProvider.theme('dorrbell')
    .primaryPalette('dorrbell-blue', {
      'default' : '500'
    })
    .accentPalette('dorrbell-accent', {
      'default' : '500'
    });
  $mdThemingProvider.theme('dark-grey').backgroundPalette('blue-grey').dark();
    $mdThemingProvider.setDefaultTheme('dorrbell');
  //
  // Now set up the states
  $stateProvider
    // .state('home', {
    //   url: "/",
    //   templateUrl: "app/templates/home.html",
    //   controller: "HomeController"
    // })
    .state('home', {
      url : '/',
      externalUrl: 'https://try.dorrbell.com',
      external : true
    })
    .state('register', {
      url : "/register",
      templateUrl: "app/templates/register.html",
      controller : "RegisterController",
      reloadOnSearch: false
    })
    .state('howItWorks', {
      url : '/howItWorks',
      templateUrl : "app/templates/howItWorks.html"
    })
    .state('terms', {
      url : '/terms',
      templateUrl : "app/templates/terms.html"
    })
    .state('privacy', {
      url : '/privacy',
      templateUrl : "app/templates/privacy.html"
    })
    .state('about', {
      url : '/about',
      templateUrl : "app/templates/about.html"
    })
    .state('press', {
      url : '/press',
      templateUrl : 'app/templates/press.html'
    })
});
