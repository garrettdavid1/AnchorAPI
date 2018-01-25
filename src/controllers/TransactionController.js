transactionHandler = (function () {
    var TransactionController = function () {
        var self = this;
        self.db;

        self.saveTransaction = function (params, res) {
            var transaction = params.transaction;
            var date = new Date(transaction.transDate);
            self.db.get('Month', { 'monthNum': date.getMonth(), 'year': date.getFullYear() }, function (result) {
                if (result[0] !== undefined) {
                    month = result[0];
                    month.transactions = month.transactions === undefined ? [] : month.transactions;
                    if (transaction._id !== undefined && transaction._id !== '') {
                        transaction._id = safeObjectId(transaction._id);
                        var oldAmount = transaction.transAmount;
                        self.db.update('Transaction', { '_id': transaction._id }, {
                            'transName': transaction.transName, 'transAmount': transaction.transAmount,
                            'transType': transaction.transType, 'transDate': new Date(transaction.transDate)
                        }, function (result) {
                            return monthCtrl.updateMonthWithTrans(month, transaction, date, oldAmount, res);
                        });
                    } else {
                        if (transaction._id === '') delete transaction._id;
                        self.db.add('Transaction', transaction, function (result) {
                            return monthCtrl.updateMonthWithTrans(month, transaction, date, oldAmount, res);
                        });
                    }
                } else {
                    var month = {
                        'monthName': monthCtrl.getMonthName(today.getMonth()),
                        'monthNum': today.getMonth(),
                        'year': today.getFullYear(),
                        'startingBal': params.val,
                        'endingBal': params.val,
                        'transactions': [],
                        'wasNull': false,
                        'isFirstAvailableMonth': true
                    };
                    console.log('month = ' + month);
                }
            })
        }

        self.deleteTransaction = function(params, res){
            var id = safeObjectId(params.transId);
            db.delete('Transaction', { '_id': id }, function (result) {
                removeTransFromMonth(params.date, result, id, res);
            });
        }

        function removeTransFromMonth(date, transaction, id, res){
            date = new Date(date);
            db.get('Month', {'monthNum': date.getMonth(), 'year': date.getFullYear()}, function(result){
                var month = result[0];
                for(var i = 0; i < month.transactions.length; i++){
                    if(month.transactions[i]._id.equals(id)){
                        month.transactions.splice(i, 1);
                        break;
                    }
                }

                db.update('Month', {'monthNum': date.getMonth(), 'year': date.getFullYear()}, {'transactions': month.transactions, 'endingBal': monthCtrl.getEndingBal(month.startingBal, month.transactions)}, function(result){
                    res.send(JSON.stringify(month));
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
        saveTransaction: function(params, res){
            transactionController.saveTransaction(params, res);
        },
        deleteTransaction: function(params, res){
            transactionController.deleteTransaction(params, res);
        }
    }
})();

module.exports = transactionHandler;