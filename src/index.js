var express = require('express');
var bodyParser = require('body-parser');
var app = express();
const {ObjectId} = require('mongodb');

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

(function(monthController, transController){
    var self = this;
    self.monthCtrl = require('./controllers/MonthController.js');
    self.transCtrl = require('./controllers/TransactionController.js');
    self.db = require('./database.js');
    self.db.connect('Anchor', initControllers());
    self.safeObjectId = s => ObjectId.isValid(s) ? new ObjectId(s) : null;


    function initControllers(){
        monthCtrl.init(self.db);
        transCtrl.init(self.db);
    }
    return {
        monthCtrl: function(){
            return self.monthCtrl;
        },
        transCtrl: function(){
            return self.transCtrl;
        },
        db: function(){
            return self.db;
        },
        safeObjectId: function(){
            return self.safeObjectId;
        }
    }
})();

/*:::::::::::::::: Routes ::::::::::::::::*/
app.get('/', function(req, res, next){
    res.sendFile(__dirname + '/index.html');
});

app.get('/getMonthData/:month/:year', function(req, res, next){
    res.setHeader('Content-Type', 'application/json');
    monthCtrl.getMonthData(req.params, res);
});

app.get('/initStartingBal/:val/:date', function(req, res, next){
    res.setHeader('Content-Type', 'application/json');
    monthCtrl.createInitialMonth(req.params.date, req.params.val, res);
});

app.post('/saveTransaction', function(req, res, next){
    res.setHeader('Content-Type', 'application/json');
    transCtrl.saveTransaction(req.body, res);
});

app.get('/deleteTransaction/:date/:transId', function(req, res, next){
    transCtrl.deleteTransaction(req.params, res);
});
/*:::::::::::::::: End of Routes ::::::::::::::::*/

var server = app.listen(1337, function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log('Anchor API running at http://%s:%s', host, port);
});