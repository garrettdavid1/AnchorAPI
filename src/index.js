var express = require('express');
// var data = require('../tempDev/transactionData');
var db = require('./database.js');
var models = require('./models.js');
models.init();
var bodyParser = require('body-parser');
const {ObjectId} = require('mongodb'); // or ObjectID 
// or var ObjectId = require('mongodb').ObjectId if node version < 6
const safeObjectId = s => ObjectId.isValid(s) ? new ObjectId(s) : null;
db.connect('Anchor');
var app = express();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

/*:::::::::::::::: Routes ::::::::::::::::*/
app.get('/', function(req, res, next){
    res.sendFile(__dirname + '/index.html');
});

app.get('/getMonthData/:month/:year', function(req, res, next){
    var monthNum = parseInt(req.params.month);
    var year = parseInt(req.params.year);
    db.get('Month', {'monthNum': monthNum, 'year': year}, function(result){
        var month = result;
            var wasNull = month[0] === undefined ? true: false;
            if(month[0] === undefined){
                db.getAll('Month', function (result) {
                    var today = new Date();
                    month = models.month(monthNum, year)

                    if (monthNum !== today.getMonth() || year !== today.getFullYear()) {
                        var latestMonth = result[result.length - 1];
                        month.startingBal = latestMonth.endingBal;
                    }

                    month.wasNull = wasNull;

                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(month));
                })
            }else{
                month = month[0];
                month.wasNull = wasNull;

                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(month));
            }
    });
});

app.get('/initStartingBal/:val', function(req, res, next){
    var today = new Date();
    var month = {
        'monthName': models.getMonthName(today.getMonth()),
        'monthNum': today.getMonth(),
        'year': today.getFullYear(),
        'startingBal': req.params.val,
        'endingBal': req.params.val,
        'transactions': [],
        'wasNull': false,
        'isFirstAvailableMonth': true
    };
    db.add('Month', month);
    res.send(JSON.stringify(month));
});

app.post('/saveTransaction', function(req, res, next){
    var params = req.body;
    var transaction = params.transaction;
    var date = new Date(transaction.transDate);
    db.get('Month', {'monthNum': date.getMonth(), 'year': date.getFullYear()}, function(result){
        var month = result[0];
        month.transactions = month.transactions === undefined ? [] : month.transactions;
        if(transaction._id !== undefined && transaction._id !== ''){
            transaction._id = safeObjectId(transaction._id);
            var oldAmount = transaction.transAmount;
            db.update('Transaction', {'_id' : transaction._id}, {'transName' : transaction.transName, 'transAmount': transaction.transAmount,
        'transType': transaction.transType, 'transDate': new Date(transaction.transDate)}, function(result){
                updateMonthWithTransAndSend(month, transaction, date, oldAmount, res);
            });
        }else{
            if(transaction._id === '') delete transaction._id;
            db.add('Transaction', transaction, function(result){
                updateMonthWithTransAndSend(month, transaction, date, oldAmount, res);
            });
        }
        
    })
});

app.get('/deleteTransaction/:date/:transId', function(req, res, next){
    var id = safeObjectId(req.params.transId);
    db.delete('Transaction', {'_id': id}, function(result){
        removeTransFromMonth(req.params.date, result, id, res);
    });
});
/*:::::::::::::::: End of Routes ::::::::::::::::*/

/*:::::::::::::::: Month Helper Functions ::::::::::::::::*/
function updateMonthWithTransAndSend(month, transaction, date, oldAmount, res){
    transaction.transDate = new Date(transaction.transDate);
    if(month.transactions.length > 0){
        var thisDate;
        var inserted = false;
        for(var i = 0; i < month.transactions.length; i++){
            thisDate = new Date(month.transactions[i].transDate);
            if(month.transactions[i]._id.equals(transaction._id)){
                month.transactions.splice(i, 1, transaction);
                inserted = true;
                break;
            }else if(thisDate.getTime() > transaction.transDate.getTime()){
                month.transactions.splice(i, 0, transaction);
                inserted = true;
                break;
            }
        }
        if(!inserted){
            month.transactions.push(transaction);
        }
    }else{
        month.transactions.push(transaction);
    }
    var endingBal = parseFloat(month.startingBal);
    month.transactions.forEach(function(trans){
        endingBal += parseFloat(trans.transAmount);
    });
    month.endingBal = endingBal;
    // oldAmount = oldAmount === undefined ? 0 : oldAmount;
    // console.log(parseFloat(month.endingBal));
    // console.log(parseFloat(oldAmount));
    // console.log(parseFloat(transaction.transAmount));
    // month.endingBal = parseFloat(month.endingBal) - parseFloat(oldAmount) + parseFloat(transaction.transAmount);
    db.update('Month', {'monthNum': date.getMonth(), 'year': date.getFullYear()}, {'transactions': month.transactions, 'endingBal': parseFloat(month.endingBal)}, function(result){
        res.send(JSON.stringify(month));
    });
}

function removeTransFromMonth(date, transaction, transId, res){
    date = new Date(date);
    db.get('Month', {'monthNum': date.getMonth(), 'year': date.getFullYear()}, function(result){
        var month = result[0];
        for(var i = 0; i < month.transactions.length; i++){
            if(month.transactions[i]._id.equals(transId)){
                month.transactions.splice(i, 1);
                break;
            }
        }

        db.update('Month', {'monthNum': date.getMonth(), 'year': date.getFullYear()}, {'transactions': month.transactions, 'endingBal': parseFloat(month.endingBal) - parseFloat(transaction.transAmount)}, function(result){
            res.send(JSON.stringify(month));
        });
    });
}
/*:::::::::::::::: End of Month Helper Functions ::::::::::::::::*/

var server = app.listen(1337, function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log('Anchor API running at http://%s:%s', host, port);
});