dorrbell.controller("HomeController", function($scope, $mdDialog, $mdMedia, $rootScope, $location, FacebookFactory, GoogleFactory, HerokuService){
  $scope.showDialog = function(ev){
    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
    $mdDialog.show({
      controller: "RegisterDialogController",
      templateUrl: 'register-modal.htm',
      parent: angular.element(document.body),
      targetEvent: ev,
      controllerAs : 'dialog',
      clickOutsideToClose:true,
      fullscreen: useFullScreen,
      targetEvent : ev
    });
  }
  $scope.$watch(function() {
    return $mdMedia('xs') || $mdMedia('sm');
  }, function(wantsFullScreen) {
    $scope.customFullscreen = (wantsFullScreen === true);
  });

  firebase.auth().onAuthStateChanged(function(user) {
    console.log($location.search().error);
    if (user && $location.search().error != "no-service") {
      $scope.$apply(function(){
          $scope.currentUser = user;
      })
    }
  });

  $scope.goToStore = function(){
    if($scope.currentUser)
      window.location.href = "https://dorrbell-test.myshopify.com";
    else
      $scope.showDialog();
  }

  firebase.auth().getRedirectResult().then(function(result){
    if(result && result.credential){
      $scope.showDialog();
    }
  });

});

dorrbell.controller("RegisterDialogController", function($scope, $rootScope, $mdDialog, $mdMedia, FacebookFactory, GoogleFactory, HerokuService, AuthenticationService){
  $scope.states = ('AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS ' +
    'MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI ' +
    'WY').split(' ').map(function(state) {
        return {abbrev: state};
      });
  $scope.model = {
    step : 0
  }

  $scope.phoneNumberPattern = (function() {
      var regexp = /^\(?(\d{3})\)?[ .-]?(\d{3})[ .-]?(\d{4})$/;
      return {
          test: function(value) {
              if( $scope.requireTel === false ) {
                  return true;
              }
              return regexp.test(value);
          }
      };
  })();

  $scope.register = function(type){
    var provider;
    if(type == 'facebook'){
      provider = new firebase.auth.FacebookAuthProvider();
      provider.addScope("user_location");
      provider.addScope("user_birthday");
    }else if(type == 'twitter'){
      provider = new firebase.auth.TwitterAuthProvider();
    }else if(type == 'google'){
      provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/plus.login');
      provider.addScope("https://www.googleapis.com/auth/plus.me");
      provider.addScope("https://www.googleapis.com/auth/userinfo.email");
      provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
    }

    if($scope.customFullscreen){
      firebase.auth().signInWithRedirect(provider);
    }else{
      firebase.auth().signInWithPopup(provider).then($scope.handleResult).catch(function(e){
        if(e.credential){
          AuthenticationService.link(e.credential).then($scope.handleResult, function(){
            $mdDialog.show(
              $mdDialog.alert()
                .parent(angular.element(document.querySelector('body')))
                .clickOutsideToClose(true)
                .title('Error authenticating')
                .textContent(e.message)
                .ok('Got it!')
            );
          });
        }
      });
    }
  }
  $scope.closeDialog = function(){
    $mdDialog.hide();
  }

  $scope.handleResult = function(result){
    if(result && result.credential){
      $scope.credential = result.credential;
      $scope.model.loading = true;
      HerokuService.post('api/validate-user', {uid : result.user.uid}).then(function(res){
        $scope.model.loading = false;
        $scope.model = {step : 2, authorized : (res.status == 201), returning : true};
      }, function(err){
        $scope.user = {
          photoUrl : result.user.photoURL,
          networkId : result.user.providerData[0].uid,
          uid : result.user.uid,
          email : result.user.email,
          displayName : result.user.displayName
        }
        if(result.credential.provider == "facebook.com"){
          FacebookFactory.me(result).then(function(result){
            var y = result.data.birthday.split("/");
            var d = new Date();
            d.setYear(y[2]);
            d.setMonth(y[0] - 1);
            d.setDate(y[1]);

            $scope.user = $scope.merge($scope.user, {
              firstName : result.data.first_name,
              lastName : result.data.last_name,
              email : result.data.email,
              gender : result.data.gender,
              birthday : d,
              city : result.data.location.location.city,
              state : result.data.location.location.state,
              provider : "Facebook"
            });
            $scope.$apply(function () {
                $scope.model.loading = false;
                $scope.model.step = 1
            });

          });
        }else if(result.credential.provider == "twitter.com"){
          HerokuService.post("api/twitter-info", {
            accessToken : result.credential.accessToken,
            secret : result.credential.secret,
            uid : result.user.providerData[0].uid
          }).then(function(result){
            var name = result.data.name.split(" ");
            $scope.user = $scope.merge($scope.user, {
              firstName : name[0],
              lastName : name[1],
              provider : "Twitter"
            });
            $scope.model.loading = false;
            $scope.model.step = 1;
          })
        }else if(result.credential.provider == "google.com"){
          GoogleFactory.getProfile(result.user.providerData[0].uid, result.credential.accessToken).then(function(user){
            $scope.user = $scope.merge($scope.user, {
              firstName : user.data.name.givenName,
              lastName : user.data.name.familyName,
              email : result.user.email,
              gender : user.data.gender,
              photoUrl : user.data.image.url,
              provider : "GooglePlus"
            });
            if(user.data.birthday){
              var y = user.data.birthday.split("-");
              if(y[0] != "0000")
                var d = new Date();
                d.setYear(y[0]);
                d.setMonth(y[1] - 1);
                d.setDate(y[2]);
                $scope.user.birthday = d;
            }
            $scope.model.loading = false;
            $scope.model.step = 1;
          })
        }
      })
    }
  }

  $scope.$watch(function() {
    return $mdMedia('xs') || $mdMedia('sm');
  }, function(wantsFullScreen) {
    $scope.customFullscreen = (wantsFullScreen === true);
  });

  $scope.validate = function(form){
    form.$setSubmitted();
    if(form.$valid){
      $scope.model.loading = true;
      HerokuService.post('api/register', $scope.user).then(function(response){
        $scope.model = {step : 2, authorized : (response.status == 201)};
        $scope.model.loading = false;
      }, function(){$scope.model.loading = false;});
    }
  }

  $scope.merge = function(obj1, obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
  }

  $scope.goToStore = function(){
    window.location.href = "https://dorrbell-test.myshopify.com?token=" + btoa(JSON.stringify($scope.credential));
  }

  firebase.auth().getRedirectResult().then(function(result){
    if(result && result.credential){
      $scope.handleResult(result);
    }
  });
});

dorrbell.controller("RegisterController", function($scope, $mdDialog){
  $mdDialog.show({
    controller: "RegisterDialogController",
    templateUrl: 'register-modal.htm',
    parent: angular.element(document.getElementsByClassName('register-page')),
    controllerAs : 'dialog',
    clickOutsideToClose:false,
    fullscreen: false,
    escapeToClose : false
  })
  .then(function(answer) {
    $scope.status = 'You said the information was "' + answer + '".';
  }, function() {
    $scope.status = 'You cancelled the dialog.';
  });
});
