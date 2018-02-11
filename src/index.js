var express = require('express');
var bodyParser = require('body-parser');
var app = express();
const {ObjectId} = require('mongodb');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var config;
try{
    config = require('./appconfig.js');
}catch(err){
    config = null;
}

(function(monthController, transController){
    var self = this;
    self.monthCtrl = require('./controllers/MonthController.js');
    self.transCtrl = require('./controllers/TransactionController.js');
    self.userCtrl = require('./controllers/UserController.js');
    self.accountCtrl = require('./controllers/AccountController.js');
    self.lib = require('./helpers/lib.js');
    self.db = require('./database.js');
    self.db.connect((config !== undefined && config !== null) ? config.devDbName : 'anchor', initControllers(self.db));
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
    res.header("Access-Control-Allow-Origin", lib.allowedOrigins());
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(session({
    name: 'anchorSession',
    secret: lib.sessionSecret(config),
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
        url: lib.mongoConnectionString(config),
        ttl: 1 * 60 * 60 //1 hour

    }),
    cookie: {
        maxAge:  60 * 60 * 1000, //1 hour
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
            month.userName = req.session.userName;
            res.send(JSON.stringify(month));
        });
    } else{
        res.send(JSON.stringify({'result': 'failure', 'message': 'No valid session found.'}));
    }
});

app.get('/initStartingBal/:val/:date', function(req, res, next){
    res.setHeader('Content-Type', 'application/json');
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
    accountCtrl.registerUser(req.body.userName, req.body.password, req.body.email, function(result){
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
        if(lib.exists(result.user)){
            res.send(JSON.stringify({'result': 'success'}));
        } else{
            res.send(JSON.stringify({'result': 'failure'}));
        }
    });
});

app.post('/login', function(req, res, next){
    if(req.session.userId){
        req.session.save(function(err){
            res.redirect('/getMonthData/' + new Date().getMonth() + '/' + new Date().getFullYear());
        });
    } else{
        if(lib.exists(req.body.password)){
            accountCtrl.login(req.body.email, req.body.password, function(result){
                if(result.result === 'failure'){
                    res.send(JSON.stringify(result));
                }else{
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
                }
                
            });
        }else{
            res.send(JSON.stringify({'result': 'failure', 'message': 'Invalid session'}));
        }
    }
});

app.get('/logout', function(req, res, next){
    if(req.session){
        db.delete('sessions', {'_id': req.sessionID});
        req.session.destroy();
    }
    res.send(JSON.stringify({'result': 'success'}))
})
/*:::::::::::::::: End of Routes ::::::::::::::::*/

var server = app.listen(lib.port(), function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log('Anchor API running at http://%s:%s', host, port);
});