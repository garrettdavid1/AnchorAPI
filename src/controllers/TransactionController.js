transactionHandler = (function () {
    var TransactionController = function () {
        var self = this;

        self.saveTransaction = function (userId, params, callback) {
            var transaction = params.transaction;
            transaction.userId = userId;
            var date = new Date(transaction.transDate);
            db.get('Month', {'userId': userId, 'monthNum': date.getMonth(), 'year': date.getFullYear() }, null, function (result) {
                if (result[0] !== undefined) {
                    month = result[0];
                    month.transactions = month.transactions === undefined ? [] : month.transactions;
                    if (transaction._id !== undefined && transaction._id !== '') {
                        transaction._id = safeObjectId(transaction._id);
                        db.update('Transaction', { '_id': transaction._id }, {
                            'transName': transaction.transName, 'transAmount': transaction.transAmount,
                            'transType': transaction.transType, 'transDate': new Date(transaction.transDate)
                        }, function (result) {
                            return monthCtrl.updateMonthWithTrans(userId, month, transaction, date, callback);
                        });
                    } else {
                        if (transaction._id === '') delete transaction._id;
                        db.add('Transaction', transaction, function (result) {
                            return monthCtrl.updateMonthWithTrans(userId, month, transaction, date, callback);
                        });
                    }
                } else {
                    if (transaction._id === '') delete transaction._id;
                    db.add('Transaction', transaction, function(result){
                        monthCtrl.createNewMonthWithTransaction(userId, date, transaction, callback);
                    });
                }
            })
        }

        self.deleteTransaction = function(userId, params, callback){
            var id = safeObjectId(params.transId);
            db.delete('Transaction', { '_id': id }, function (result) {
                removeTransFromMonth(userId, params.date, result, id, callback);
            });
        }

        function removeTransFromMonth(userId, date, transaction, id, callback){
            date = new Date(parseInt(date));
            db.get('Month', {'userId': userId, 'monthNum': date.getMonth(), 'year': date.getFullYear()}, null, function(result){
                var month = result[0];
                for(var i = 0; i < month.transactions.length; i++){
                    if(month.transactions[i]._id.equals(id)){
                        month.transactions.splice(i, 1);
                        break;
                    }
                }

                db.update('Month', {'userId': userId, 'monthNum': date.getMonth(), 'year': date.getFullYear()}, {'transactions': month.transactions, 'endingBal': monthCtrl.getEndingBal(month.startingBal, month.transactions)}, function(result){
                    month = monthCtrl.sortMonthlyTransactions(month);
                    lib.handleResult(month, callback)
                });
            });
        }

    }

    var transactionController;

    return {
        init: function(){
            transactionController = new TransactionController();
        },
        saveTransaction: function(userId, params, callback){
            transactionController.saveTransaction(userId, params, callback);
        },
        deleteTransaction: function(userId, params, callback){
            transactionController.deleteTransaction(userId, params, callback);
        }
    }
})();

module.exports = transactionHandler;