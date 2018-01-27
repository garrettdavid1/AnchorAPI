transactionHandler = (function () {
    var TransactionController = function () {
        var self = this;
        self.db;

        self.saveTransaction = function (params, callback) {
            var transaction = params.transaction;
            var date = new Date(transaction.transDate);
            self.db.get('Month', { 'monthNum': date.getMonth(), 'year': date.getFullYear() }, null, function (result) {
                if (result[0] !== undefined) {
                    month = result[0];
                    month.transactions = month.transactions === undefined ? [] : month.transactions;
                    if (transaction._id !== undefined && transaction._id !== '') {
                        transaction._id = safeObjectId(transaction._id);
                        self.db.update('Transaction', { '_id': transaction._id }, {
                            'transName': transaction.transName, 'transAmount': transaction.transAmount,
                            'transType': transaction.transType, 'transDate': new Date(transaction.transDate)
                        }, function (result) {
                            return monthCtrl.updateMonthWithTrans(month, transaction, date, callback);
                        });
                    } else {
                        if (transaction._id === '') delete transaction._id;
                        self.db.add('Transaction', transaction, function (result) {
                            return monthCtrl.updateMonthWithTrans(month, transaction, date, callback);
                        });
                    }
                } else {
                    if (transaction._id === '') delete transaction._id;
                    self.db.add('Transaction', transaction, function(result){
                        monthCtrl.createNewMonthWithTransaction(date, transaction, callback);
                    });
                }
            })
        }

        self.deleteTransaction = function(params, callback){
            var id = safeObjectId(params.transId);
            db.delete('Transaction', { '_id': id }, function (result) {
                removeTransFromMonth(params.date, result, id, callback);
            });
        }

        function removeTransFromMonth(date, transaction, id, callback){
            date = new Date(parseInt(date));
            db.get('Month', {'monthNum': date.getMonth(), 'year': date.getFullYear()}, null, function(result){
                var month = result[0];
                for(var i = 0; i < month.transactions.length; i++){
                    if(month.transactions[i]._id.equals(id)){
                        month.transactions.splice(i, 1);
                        break;
                    }
                }

                db.update('Month', {'monthNum': date.getMonth(), 'year': date.getFullYear()}, {'transactions': month.transactions, 'endingBal': monthCtrl.getEndingBal(month.startingBal, month.transactions)}, function(result){
                    month = monthCtrl.sortMonthlyTransactions(month);
                    if(callback !== undefined){
                        callback(month);
                    } else{
                        return month;
                    }
                });
            });
        }

    }

    var transactionController;

    return {
        init: function(db){
            transactionController = new TransactionController(db);
            transactionController.db = db;
        },
        saveTransaction: function(params, callback){
            transactionController.saveTransaction(params, callback);
        },
        deleteTransaction: function(params, callback){
            transactionController.deleteTransaction(params, callback);
        }
    }
})();

module.exports = transactionHandler;