var express = require('express');
// var data = require('../tempDev/transactionData');
var Database = require('./database.js')
var db = new Database();
var app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.get('/', function(req, res, next){
    res.sendFile(__dirname + '/index.html');
});

app.get('/getData/:month', function(req, res, next){
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(db.getData(req.params.month)));
});

var server = app.listen(1337, function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log('Anchor API running at http://%s:%s', host, port);
});