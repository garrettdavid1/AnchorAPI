monthHandler = (function () {
    var MonthController = function(){
        var self = this;
        self.monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        self.newMonth = function(userId, monthNum, year, startingBal){
            return {
                'userId': userId,
                'firstDayOfMonth': new Date(year, monthNum, 1, 0, 0, 0, 0),
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

        self.createInitialMonth = function(userId, date, startingBal, callback){
            var today = new Date(date);
            var month = self.newMonth(userId, today.getMonth(), today.getFullYear(), startingBal);
            month.isFirstAvailableMonth = true;
            db.add('Month', month, function(result){
            });
            lib.handleResult(month, callback);
        };

        self.getMonthData = function (userId, params, callback) {
            var monthNum = parseInt(params.month);
            var year = parseInt(params.year);
            db.get('Month', { 'userId': userId, 'monthNum': monthNum, 'year': year }, null, function (result) {
                var month = result;
                if (month === null || month[0] === undefined) {
                    db.get('Month', {'userId': userId, 'firstDayOfMonth': {'$lt': new Date(year, monthNum, 1, 0, 0, 0, 0)}}, {firstDayOfMonth: 1}, function (result) {
                        month = monthController.newMonth(userId, monthNum, year, 0);
                        month.wasNull = true;

                        var latestMonth = result !== null ? result[result.length - 1] : undefined;
                        if(latestMonth !== undefined && latestMonth !== null){
                            month.startingBal = latestMonth.endingBal;
                        }

                        lib.handleResult(month, callback);
                    })
                } else {
                    month = month[0];
                    db.get('Month', {'userId': userId, 'firstDayOfMonth': {'$lt': month.firstDayOfMonth}}, {'firstDayOfMonth': 1}, function(result){
                        month.wasNull = false;
                        if(result.length > 0){
                            var prevMonth = result[result.length - 1];
                            month.startingBal = prevMonth.endingBal;
                            self.updateMonth(userId, month, callback);
                        }else{
                            month = self.sortMonthlyTransactions(month);
                            lib.handleResult(month, callback);
                        }
                    });
                    
                }
            });
        };

        self.createNewMonthWithTransaction = function(userId, date, transaction, callback){
            var beginningOfTheMonth = new Date(date.getTime());
            beginningOfTheMonth.setDate(1);
            var twoYearsAgo = new Date(beginningOfTheMonth.getTime());
            twoYearsAgo.setFullYear(date.getFullYear() - 2);

            db.get('Month', { 'userId': userId, 'firstDayOfMonth': { "$lt": beginningOfTheMonth, "$gt": twoYearsAgo } }, {'firstDayOfMonth': 1}, function (result) {
                var prevMonthWithData = result[result.length - 1];
                var month = self.newMonth(userId, date.getMonth(), date.getFullYear(), prevMonthWithData.endingBal);
                month.transactions.push(transaction);
                month.endingBal = self.getEndingBal(month.startingBal, month.transactions);
                db.add('Month', month);
                lib.handleResult(month, callback);
            });
        }

        self.updateMonthWithTrans = function(userId, month, transaction, date, callback){
            transaction.transDate = new Date(transaction.transDate);
            if(month.transactions.length > 0){
                var inserted = false;
                for(var i = 0; i < month.transactions.length; i++){
                    if(month.transactions[i]._id.equals(transaction._id)){
                        month.transactions.splice(i, 1, transaction);
                        inserted = true;
                        break;
                    }
                }
                if(!inserted){
                    var thisDate;
                    for(var j = 0; j < month.transactions.length; j++){
                        thisDate = new Date(month.transactions[j].transDate);
                        if(thisDate.getTime() > transaction.transDate.getTime()){
                            month.transactions.splice(j, 0, transaction);
                            inserted = true;
                            break;
                        }
                    }
                    
                    if (!inserted) {
                        month.transactions.push(transaction);
                    }
                    
                }
            }else{
                month.transactions.push(transaction);
            }
            
            self.updateMonth(userId, month, callback);
        };

        self.updateMonth = function(userId, month, callback){
            db.update('Month', {'userId': userId, 'monthNum': month.firstDayOfMonth.getMonth(), 'year': month.firstDayOfMonth.getFullYear()}, {'userId': userId, 'transactions': month.transactions, 'startingBal': month.startingBal, 'endingBal': self.getEndingBal(month.startingBal, month.transactions)}, function(result){
                month = self.sortMonthlyTransactions(month);
                lib.handleResult(month, callback);
            });
        }

        self.getEndingBal = function(startingBal, transactions){
            var endingBal = parseFloat(startingBal);
            if(transactions.length > 0){
                transactions.forEach(function(trans){
                    endingBal += parseFloat(trans.transAmount);
                });
            }
            return endingBal;
        }

        self.sortMonthlyTransactions = function(month){
            if(month !== undefined){
                var transactions = month.transactions;
                var newTransactionsArray = [];
                var inserted;
                for(var i = 0; i < transactions.length; i++){
                    inserted = false;
                    if(newTransactionsArray.length === 0){
                        newTransactionsArray.push(transactions[i]);
                        inserted = true;
                    }else{
                        for(var j = 0; j < newTransactionsArray.length; j++){
                            if(newTransactionsArray[j].transDate.getTime() > transactions[i].transDate.getTime()){
                                newTransactionsArray.splice(j, 0, transactions[i]);
                                inserted = true;
                                break;
                            }else{
                            }
                        }

                        if(!inserted){
                            newTransactionsArray.push(transactions[i]);
                        }
                    }
                }
                month.transactions = newTransactionsArray;
            }
            return month;
        }
    }

    var monthController;

    return {
        init: function(){
            monthController = new MonthController();
        },
        newMonth: function (userId, month, year, startingBal) {
            return monthController.newMonth(userId, month, year, startingBal);
        },
        getMonthName: function(monthNum){
            return monthController.monthNames[monthNum];
        },
        createInitialMonth: function(userId, date, startingBal, callback){
            return monthController.createInitialMonth(userId, date, startingBal, callback);
        },
        getMonthData: function(userId, params, callback){
            return monthController.getMonthData(userId, params, callback);
        },
        updateMonthWithTrans: function(userId, month, transaction, date, callback){
            return monthController.updateMonthWithTrans(userId, month, transaction, date, callback);
        },
        getEndingBal: function(startingBal, transactions){
            return monthController.getEndingBal(startingBal, transactions);
        },
        sortMonthlyTransactions: function(month){
            return monthController.sortMonthlyTransactions(month);
        },
        createNewMonthWithTransaction: function(userId, date, transaction, callback){
            return monthController.createNewMonthWithTransaction(userId, date, transaction, callback);
        }
    }
})();

module.exports = monthHandler;