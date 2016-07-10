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
    $scope.$apply(function(){
        $scope.currentUser = user;
    })
  });

  $scope.goToStore = function(){
    if($scope.currentUser)
      window.location.href = "https://dorrbell-test.myshopify.com";
    else
      $scope.showDialog();
  }

  if($location.search().action == 'signOut'){
    firebase.auth().signOut();
    $scope.currentUser = null;
  }


  firebase.auth().getRedirectResult().then(function(result){
    if(result && result.credential){
      $scope.showDialog();
    }
  });

});

dorrbell.controller("RegisterDialogController", function($scope, $rootScope, $mdDialog, $mdMedia, $location, FacebookFactory, GoogleFactory, HerokuService, AuthenticationService){
  $scope.closeDialog = function(){
    $mdDialog.hide();
  }

  $scope.register = function(type){
    var provider;
    if(type == 'facebook'){
      provider = new firebase.auth.FacebookAuthProvider();
      provider.addScope("user_location");
      provider.addScope("user_birthday");
    }

    if($scope.customFullscreen){
      firebase.auth().signInWithRedirect(provider);
    }else{
      firebase.auth().signInWithPopup(provider).then($scope.handleResult).catch(function(e){
        $scope.$apply(function(){
          $scope.model.error = e.message;
          $scope.model.loading = false;
        });
      });
    }
  }

  $scope.registerEmail = function(form){
    form.$setSubmitted();
    if(form.$valid){
      $scope.model.loading = true;
      firebase.auth().createUserWithEmailAndPassword($scope.user.email, $scope.user.password).then(function(r){
        $scope.user.uid = r.uid;
        $scope.user.provider = r.providerData[0].providerId;
        $scope.credential = {email : $scope.user.email, password : $scope.user.password, provider : $scope.user.provider}
        $scope.validate();
      }).catch(function(e) {
        $scope.$apply(function(){
          $scope.model.error = e.message;
          $scope.model.loading = false;
        });
      })
    }
  }



  $scope.login = function(form){
    form.$setSubmitted();
    if(form.$valid){
      $scope.model.loading = true;
      firebase.auth().signInWithEmailAndPassword($scope.user.email, $scope.user.password).then(function(user){
        HerokuService.post('api/validate-user', {uid : user.uid}).then(function(res){
          $scope.model.loading = false;
          if(res.status === 201)
            window.location.href = "https://dorrbell-test.myshopify.com?token=" + btoa(JSON.stringify($scope.credential));
          else
            $scope.model = {step : 2, authorized : false, loading : false};
        }, function(e){
          $scope.$apply(function(){
            $scope.model.error = e.message;
            $scope.model.loading = false;
          });
        });
      }, function(e){
        $scope.$apply(function(){
          $scope.model.error = e.message;
          $scope.model.loading = false;
        });
      });
    }
  }

  $scope.resetPassword = function(form){
    form.$setSubmitted();
    if(form.$valid){
      $scope.model.loading = true;
      firebase.auth().sendPasswordResetEmail($scope.user.email).then(function(){
        $scope.$apply(function(){
          $scope.model.loading = false;
          $scope.model.resetSent = true;
        });

      }, function(err){
        $scope.$apply(function(){
          $scope.model.error = err.message;
          $scope.model.loading = false;
        })
      })
    }
  }

  $scope.verifyZipCode = function(form){
    form.$setSubmitted();
    if(form.$valid){
      $scope.model.loading = true;
      HerokuService.get('api/validate-zip/' + $scope.user.postalCode).then(function(response){
        $location.search('pc', $scope.user.postalCode);
        if(response.status == 200)
          $scope.model = {step : 1, authorized : true, loading : false, returning : false};
        else
          $scope.model = {step : 1, authorized : false, loading : false, returning : false};
      })
    }
  }

  $scope.goToLogin = function(){
    $scope.model = {step : 1, authorized : true, returning : true};
  }

  $scope.goToPasswordReset = function(){
    $scope.model = {step : 3, authorized : false, returning : true};
  }

  $scope.goBack = function(){
    $scope.model.step = ($scope.model.step == 3) ? 1 : 0;
  }

  $scope.handleResult = function(result){
    if(result && result.credential){
      $scope.credential = result.credential;
      $scope.model.loading = true;
      HerokuService.post('api/validate-user', {uid : result.user.uid}).then(function(res){
        $scope.model.loading = false;
        if(res.status === 201)
          window.location.href = "https://dorrbell-test.myshopify.com?token=" + btoa(JSON.stringify($scope.credential));
        else
          $scope.model = {step : 2, authorized : false};
      }, function(err){
        $scope.user = {
          photoUrl : result.user.photoURL,
          networkId : result.user.providerData[0].uid,
          uid : result.user.uid,
          email : result.user.email,
          postalCode : $location.search().pc,
          leadSource : $location.search().promo,
          displayName : result.user.displayName
        }
        if(result.credential.provider == "facebook.com"){
          FacebookFactory.me(result).then(function(result){
            var d;
            if(result.data.birthday){
              var y = result.data.birthday.split("/");
              d = new Date();
              d.setYear(y[2]);
              d.setMonth(y[0] - 1);
              d.setDate(y[1]);
            }
            $scope.user = $scope.merge($scope.user, {
              firstName : result.data.first_name,
              lastName : result.data.last_name,
              email : result.data.email,
              gender : result.data.gender,
              birthday : d,
              provider : "Facebook"
            });
          }).then($scope.validate);
        }
      })
    }
  }



  $scope.$watch(function() {
    return $mdMedia('xs') || $mdMedia('sm');
  }, function(wantsFullScreen) {
    $scope.customFullscreen = (wantsFullScreen === true);
  });

  $scope.validate = function(){
    $scope.model.loading = true;
    HerokuService.post('api/register', $scope.user).then(function(response){
      $scope.model.loading = false;
      if(response.status === 201)
        window.location.href = "https://dorrbell-test.myshopify.com?token=" + btoa(JSON.stringify($scope.credential));
      else
        $scope.model = {step : 2, authorized : false};

    }, function(){$scope.model = {step : 2, loading : false, authorized : false};});
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

  if($location.search().action == 'signOut')
    firebase.auth().signOut();

  $scope.model = {
    step : 0
  }
  $scope.user = {postalCode : $location.search().pc};
});

dorrbell.controller("RegisterController", function($scope, $mdDialog, $mdMedia, $timeout){
  $scope.customFullscreen =  $mdMedia('xs') || $mdMedia('sm');
  var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
  $timeout(function(){
    $mdDialog.show({
      controller: "RegisterDialogController",
      templateUrl: 'register-modal.htm',
      parent: angular.element(document.getElementsByClassName('register-page')),
      controllerAs : 'dialog',
      clickOutsideToClose:false,
      fullscreen: useFullScreen,
      escapeToClose : false
    });
  });
  $scope.$watch(function() {
    return $mdMedia('xs') || $mdMedia('sm');
  }, function(wantsFullScreen) {
    $scope.customFullscreen = (wantsFullScreen === true);
  });
});
