dorrbell.service("HerokuService", function($http){
  return {
    post : function(route, data){
      return $http({
        method : "POST",
        headers : {
          "Content-Type" : "application/json",
          "authorization" : "Basic Z14vbjcyayxOdUpnM0pfXw=="
        },
        data : data,
        url : "https://dorrbell-test.herokuapp.com/" + route
      })
    }
  };
});


dorrbell.service("FacebookService", function($http){
  return {
    get : function(route){
      return $http({
        method : "GET",
        url : "https://graph.facebook.com/v2.6" + route
      });
    }
  }
});

dorrbell.service("GoogleService", function($http){
  return {
    get : function(route, accessToken){
      return $http({
        method : "GET",
        url : "https://www.googleapis.com" + route,
        headers : {
          "Authorization" : "Bearer " + accessToken
        }
      });
    }
  }
});


dorrbell.service("AuthenticationService", function($q){
  return {
    link : function(oc){
      return $q(function(resolve, reject){
        var credential;
        if(oc.provider == "google.com"){
          credential = firebase.auth.GoogleAuthProvider.credential(oc.idToken);
        }else if(oc.provider == "facebook.com"){
          credential = firebase.auth.FacebookAuthProvider.credential(oc.accessToken);
        }else if(oc.provider == "twitter.com"){
          credential = firebase.auth.TwitterAuthProvider.credential(oc.accessToken, oc.secret);
        }
        if(credential && firebase.auth().currentUser){
          firebase.auth().currentUser.link(credential).then(resolve, reject);
        }else{
          reject();
        }
      })
    }
  }
})
