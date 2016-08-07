dorrbell.constant('HEROKU', 'http://24.247.172.101:5050');
dorrbell.constant('SHOPIFY', 'https://dorrbell-test.myshopify.com');

/*
var config = {
  apiKey: "AIzaSyAcz_WwopApajZN2vUL_yEXdkwYZBlDHB8",
  authDomain: "dorrbell-1106.firebaseapp.com",
  databaseURL: "https://dorrbell-1106.firebaseio.com",
  storageBucket: "dorrbell-1106.appspot.com",
};
*/
var config = {
  apiKey: "AIzaSyCbzQTM1kMvD5EsdXSU-moUJFaXgHX0Kr8",
  authDomain: "dorrbell-test.firebaseapp.com",
  databaseURL: "https://dorrbell-test.firebaseio.com",
  storageBucket: "dorrbell-test.appspot.com",
};
firebase.initializeApp(config);

Raven.config('https://ba7b61828bf8414ea66856a0036f1ba0@app.getsentry.com/87885').install();
