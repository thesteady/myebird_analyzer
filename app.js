var express = require('express');
var app = express();
var PORT = 3000;


// handle index here for now,
// until complicated enough to move.
var indexController = function() {
	//implement the home page!
};


app.get('/', indexController);

var server = app.listen(PORT, function() {
  var host = server.address().address
  var port = server.address().port

  console.log('App listening at http://%s:%s', host, port)
});