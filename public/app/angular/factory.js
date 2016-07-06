dorrbell.factory("FacebookFactory", function(FacebookService){
  var accessToken;
  return {
    me : function(data){
      return new Promise(function(resolve, reject){
        FacebookService.get("/me?access_token=" + data.credential.accessToken + "&fields=gender,hometown,location{location},email,currency,devices,birthday,age_range,first_name,last_name,payment_pricepoints,relationship_status,religion").then(function(result){
          result.data.photoUrl = data.user.photoURL;
          result.data.provider = 'Facebook';
          result.data.uid = data.user.uid;
          resolve(result);
        }, reject);
      });
    }
  }
});


dorrbell.factory("GoogleFactory", function(GoogleService){
  return {
    getProfile : function(userId, accessToken){
      return GoogleService.get("/plus/v1/people/" + userId, accessToken);
    }
  }
})
