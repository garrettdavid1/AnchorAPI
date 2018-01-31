var express = require('express');
var bodyParser = require('body-parser');
var app = express();
const {ObjectId} = require('mongodb');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var config = require('./appconfig.js');

(function(monthController, transController){
    var self = this;
    self.monthCtrl = require('./controllers/MonthController.js');
    self.transCtrl = require('./controllers/TransactionController.js');
    self.userCtrl = require('./controllers/UserController.js');
    self.accountCtrl = require('./controllers/AccountController.js');
    self.lib = require('./helpers/lib.js');
    self.db = require('./database.js');
    self.db.connect('Anchor', initControllers(self.db));
    self.safeObjectId = s => ObjectId.isValid(s) ? new ObjectId(s) : null;


    function initControllers(dbInstance){
        lib.init();
        monthCtrl.init();
        transCtrl.init();
        userCtrl.init();
        accountCtrl.init();
    }

    

    return {
        lib: function(){
            return self.lib;
        },
        monthCtrl: function(){
            return self.monthCtrl;
        },
        transCtrl: function(){
            return self.transCtrl;
        },
        userCtrl: function(){
            return self.userCtrl;
        },
        accountCtrl: function(){
            return self.accountCtrl;
        },
        db: function(){
            return self.db;
        },
        safeObjectId: function(){
            return self.safeObjectId;
        }
    }
})();

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://192.168.1.68:3000");
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(session({
    name: 'anchorSession',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
        url: 'mongodb://localhost:27017/Anchor',
        ttl: 4 * 24 * 60 * 60 //4 days
    }),
    cookie: {
        maxAge: 4 * 24 * 60 * 60 * 1000, 
        httpOnly: true, path: '/',
    }
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

/*:::::::::::::::: Routes ::::::::::::::::*/
app.get('/', function(req, res, next){
    res.sendFile(__dirname + '/index.html');
});

app.get('/getMonthData/:month/:year', function(req, res, next){
    res.setHeader('Content-Type', 'application/json');
    if(lib.exists(req.session.userId)){
        monthCtrl.getMonthData(req.session.userId, req.params, function(month){
            // console.log('Username: ' + req.session.userName);
            month.userName = req.session.userName;
            res.send(JSON.stringify(month));
        });
    } else{
        res.send(JSON.stringify({'result': 'failure', 'message': 'No valid session found.'}));
    }
});

app.get('/initStartingBal/:val/:date', function(req, res, next){
    res.setHeader('Content-Type', 'application/json');
    console.log('UserId in initStartingBal: ' + req.session.userId);
    monthCtrl.createInitialMonth(req.session.userId, req.params.date, req.params.val, function(month){
        res.send(JSON.stringify(month));
    });
});

app.post('/saveTransaction', function(req, res, next){
    res.setHeader('Content-Type', 'application/json');
    transCtrl.saveTransaction(req.session.userId, req.body, function(month){
        res.send(JSON.stringify(month));
    });
});

app.get('/deleteTransaction/:date/:transId', function(req, res, next){
    transCtrl.deleteTransaction(req.session.userId, req.params, function(month){
        res.send(JSON.stringify(month));
    });
});

app.post('/register', function(req, res, next){
    accountCtrl.registerUser(req.body.userName, req.body.password, req.body.email, function(user){
        res.send(JSON.stringify(user));
    });
});

app.post('/login', function(req, res, next){
    accountCtrl.login(req.body.email, req.body.password, function(result){
        var localDateTime = new Date(req.body.date);
        var expireTime = new Date(localDateTime.getTime());
        expireTime.setHours(localDateTime.getHours() + 72);
        expireTime.setHours(0);
        expireTime.setMinutes(0);
        expireTime.setSeconds(0);
        expireTime.setMilliseconds(0);
        req.session.userId = result.user.userId;
        req.session.cookie.expires = expireTime;
        req.session.userName = result.user.userName;
        delete result.user.userId;
        req.session.save(function(err){
            res.redirect('/getMonthData/' + new Date().getMonth() + '/' + new Date().getFullYear());
        });
    });
});

app.get('/logout', function(req, res, next){
    if(req.session){
        db.delete('sessions', {'_id': req.sessionID});
        req.session.destroy();
    }
    res.send(JSON.stringify({'result': 'success'}))
})
/*:::::::::::::::: End of Routes ::::::::::::::::*/

var server = app.listen(1337, function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log('Anchor API running at http://%s:%s', host, port);
});