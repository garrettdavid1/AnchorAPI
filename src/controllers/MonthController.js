monthHandler = (function () {
    var MonthController = function(){
        var self = this;
        self.db;
        self.monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        self.newMonth = function(monthNum, year, startingBal){
            return {
                'monthName': self.monthNames[monthNum],
                'monthNum': monthNum,
                'year': year,
                'startingBal': parseFloat(startingBal),
                'endingBal': parseFloat(startingBal),
                'transactions': [],
                'wasNull': false,
                'isFirstAvailableMonth': false
            }
        }

        self.createInitialMonth = function(date, startingBal, res){
            var today = new Date(date);
            var month = self.newMonth(today.getMonth(), today.getFullYear(), startingBal);
            month.isFirstAvailableMonth = true;
            db.add('Month', month, function(result){
            });
            res.send(JSON.stringify(month));
        };

        self.getMonthData = function (params, res) {
            var monthNum = parseInt(params.month);
            var year = parseInt(params.year);
            self.db.get('Month', { 'monthNum': monthNum, 'year': year }, function (result) {
                var month = result;
                var wasNull = month[0] === undefined ? true : false;
                if (month[0] === undefined) {
                    self.db.getAll('Month', function (result) {
                        var today = new Date();
                        month = monthController.newMonth(monthNum, year, 0);

                        if (monthNum !== today.getMonth() || year !== today.getFullYear()) {
                            var latestMonth = result[result.length - 1];
                            month.startingBal = latestMonth.endingBal;
                        }

                        month.wasNull = wasNull;
                        res.send(JSON.stringify(month));
                    })
                } else {
                    month = month[0];
                    month.wasNull = wasNull;
                    res.send(JSON.stringify(month));
                }
            });
        };

        self.updateMonthWithTrans = function(month, transaction, date, oldAmount, res){
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
            

            db.update('Month', {'monthNum': date.getMonth(), 'year': date.getFullYear()}, {'transactions': month.transactions, 'endingBal': self.getEndingBal(month.startingBal, month.transactions)}, function(result){
                res.send(JSON.stringify(month));
            });
        };

        self.getEndingBal = function(startingBal, transactions){
            var endingBal = parseFloat(startingBal);
            transactions.forEach(function(trans){
                endingBal += parseFloat(trans.transAmount);
            });
            return endingBal;
        }
    }

    var monthController;

    return {
        init: function(db){
            monthController = new MonthController(db);
            monthController.db = db;
        },
        month: function (month, year) {
            return monthController.month(month, year);
        },
        getMonthName: function(monthNum){
            return monthController.monthNames[monthNum];
        },
        createInitialMonth: function(date, startingBal, res){
            return monthController.createInitialMonth(date, startingBal, res);
        },
        getMonthData: function(params, res){
            return monthController.getMonthData(params, res);
        },
        updateMonthWithTrans: function(month, transaction, date, oldAmount, res){
            return monthController.updateMonthWithTrans(month, transaction, date, oldAmount, res);
        },
        getEndingBal: function(startingBal, transactions){
            return monthController.getEndingBal(startingBal, transactions);
        }
    }
})();

module.exports = monthHandler;