dorrbell.controller("HomeController", function($scope, $mdDialog, $mdMedia, $rootScope, $location, $timeout, FacebookFactory, GoogleFactory, HerokuService, SHOPIFY){

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
    if(user){
      Raven.setUserContext(user);
      firebase.database().ref('customers/' + user.uid).on("value", function(snapshot){
        $timeout(function(){
          if(snapshot.val() && snapshot.val().contact)
            $scope.currentUser = snapshot.val().contact;
        });
      })
    }
  });

  $scope.goToStore = function(){
    if($scope.currentUser && $scope.currentUser.Qualified__c === true)
      window.location.href = SHOPIFY;
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

dorrbell.controller("RegisterDialogController", function($scope, $rootScope, $mdDialog, $mdMedia, $location, $timeout, FacebookFactory, GoogleFactory, HerokuService, AuthenticationService, SHOPIFY){
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
        Raven.captureException(e);
        $timeout(function(){
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
        $scope.user.leadSource = $location.search().lpsource;
        $scope.credential = {email : $scope.user.email, password : $scope.user.password, provider : $scope.user.provider}
        $scope.validate();
      }).catch(function(e) {
        Raven.captureException(e);
        $timeout(function(){
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
        firebase.database().ref('/customers/' + user.uid).once("value").then(function(snapshot){
          if(snapshot && snapshot.val() && snapshot.val().contact.Qualified__c === true){
            $scope.credential = {email : $scope.user.email, password : $scope.user.password, provider : user.providerData[0].providerId};
            window.location.href = SHOPIFY + "?token=" + btoa(JSON.stringify($scope.credential));
          }else if(snapshot && snapshot.val() && snapshot.val().contact.Qualified !== true){
            $timeout(function(){
              $scope.model = {step : 2, authorized : false, loading : false};
            })
          }
          else{
            $timeout(function(){
              $scope.model.error = "Unable to login. Please verify your username / password";
              $scope.model.loading = false;
            })
          }

        });
      }, function(e){
        Raven.captureException(e);
        $timeout(function(){
          $scope.model.error = "Unable to login. Please verify your username / password";
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
        $timeout(function(){
          $scope.model.loading = false;
          $scope.model.resetSent = true;
        });

      }, function(err){
        Raven.captureException(err);
        $timeout(function(){
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

      firebase.database().ref('/locations/' + $scope.user.postalCode).once('value').then(function(snapshot){
        $location.search('pc', $scope.user.postalCode);
        $timeout(function(){
          if(snapshot && snapshot.val()){
            $scope.model = {step : 1, authorized : true, loading : false, returning : false, location : snapshot.val()};
          }else{
            $scope.model = {step : 1, authorized : false, loading : false, returning : false};
          }
        })
      });
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
          window.location.href = SHOPIFY + "?token=" + btoa(JSON.stringify($scope.credential));
        else
          $scope.model = {step : 2, authorized : false};
      }, function(err){
        Raven.captureException(err);
        $scope.user = $scope.merge($scope.user, {
          photoUrl : result.user.photoURL,
          networkId : result.user.providerData[0].uid,
          uid : result.user.uid,
          email : result.user.email,
          postalCode : $location.search().pc,
          leadSource : $location.search().lpsource,
          displayName : result.user.displayName
        });
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
      if(response.status === 201){
        window.location.href = SHOPIFY + "?token=" + btoa(JSON.stringify($scope.credential));
      }else{
        Raven.captureMessage('Unauthorized Regstration', {level : 'warning'});
        $scope.model = {step : 2, authorized : false};
      }


    }, function(){$scope.model = {step : 2, loading : false, authorized : false};});
  }

  $scope.merge = function(obj1, obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
  }

  $scope.goToStore = function(){
    window.location.href = SHOPIFY + "?token=" + btoa(JSON.stringify($scope.credential));
  }

  firebase.auth().getRedirectResult().then(function(result){
    if(result && result.credential){
      $scope.handleResult(result);
    }
  });

  $scope.model = {
    step : 0
  }
  $scope.user = {postalCode : $location.search().pc};

  if($location.search().action == 'signOut')
    firebase.auth().signOut();

  if($location.search().ref){
    $scope.model.ref = $location.search().ref;
    $scope.model.checkCode = false;
    HerokuService.get('api/code/' + $scope.model.ref).then(function(response){
      $scope.model.checkCode = true;
      if(response && response.data && response.data.length == 2){
        $scope.model.referral = response.data[1].records[0];
        $scope.user.referralFrom = $scope.model.referral.Id;
        $scope.model.referralProduct = response.data[0].records[0];
      }
    }, function(){
      $scope.model.checkCode = true;
    });
  }else{
    $scope.model.checkCode = true;
  }
});

dorrbell.controller("RegisterController", function($scope, $mdDialog, $mdMedia, $timeout, SHOPIFY){
  $scope.customFullscreen =  $mdMedia('xs') || $mdMedia('sm');
  var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;


  angular.element(document).ready(function(){
    $mdDialog.show({
      controller: "RegisterDialogController",
      templateUrl: 'register-modal.htm',
      parent: angular.element(document.getElementsByClassName('register-page')),
      controllerAs : 'dialog',
      clickOutsideToClose:false,
      fullscreen: useFullScreen,
      escapeToClose : false,
      hasBackdrop : false
    });
  })


  $scope.$watch(function() {
    return $mdMedia('xs') || $mdMedia('sm');
  }, function(wantsFullScreen) {
    $scope.customFullscreen = (wantsFullScreen === true);
  });
});
