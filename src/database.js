var database = (function () {
    var Database = function () {
        var self = this;
        self.db;
        this.connect = function(dbName, callback) {
            const MongoClient = require('mongodb').MongoClient;
            const assert = require('assert');

            // Connection URL
            const url = 'mongodb://localhost:27017';

            // Use connect method to connect to the server
            MongoClient.connect(url, function (err, client) {
                assert.equal(null, err);
                console.log("Connected successfully to server");

                self.db = client.db(dbName);
                if(callback !== undefined) callback(self.db);
            });
        }

        this.add = function(collectionName, data, callback){
            if(!Array.isArray(data)){
                let array = [];
                array.push(data);
                data = array;
            }

            let collection = self.db.collection(collectionName);
            collection.insertMany(data, function(err, result){
                if(callback !== undefined) callback(result);
            });

        };

        this.get = function(collectionName, queryObj, sortBy, callback){
            let collection = self.db.collection(collectionName);

            if(sortBy !== undefined && sortBy !== null){
                collection.find(queryObj).sort(sortBy).toArray(function(err, result){
                    if(callback !== undefined) callback(result);
                });
            } else{
                collection.find(queryObj).toArray(function(err, result){
                    if(callback !== undefined) callback(result);
                });
            }
            
        }

        this.getAll = function(collectionName, callback){
            let collection = self.db.collection(collectionName);

            if(sortBy !== undefined && sortBy !== null){
                collection.find({}).sort(sortBy).toArray(function(err, result){
                    if(callback !== undefined) callback(result);
                });
            }else{
                collection.find({}).toArray(function(err, result){
                    if(callback !== undefined) callback(result);
                });
            }
            
        }

        this.update = function(collectionName, queryObj, updateObj, callback){
            let collection = self.db.collection(collectionName);
            collection.updateOne(queryObj, { $set: updateObj}, function(err, result){
                if(callback !== undefined) callback(result);
            });
        }

        this.delete = function(collectionName, queryObj, callback){
            let collection = self.db.collection(collectionName);
            collection.deleteOne(queryObj, function(err, result){
                if(callback !== undefined) callback(result);
            })
        }

        this.deleteMany = function(collectionName, queryObj, callback){
            let collection = self.db.collection(collectionName);
            collection.deleteMany(queryObj, function(err, result){
                if(callback !== undefined) callback(result);
            })
        }
    };
    var dbInstance;

    return {
        connect: function (dbName, callback) {
            dbInstance = new Database();
            dbInstance.connect(dbName, callback);
        },
        add: function(collection, data, callback){
            dbInstance.add(collection, data, callback);
        },
        get: function(collection, queryObj, sortBy, callback){
            dbInstance.get(collection, queryObj, sortBy, callback);
        }, 
        getAll: function(collectionName, sortBy, callback){
            dbInstance.getAll(collectionName, sortBy, callback);
        },
        update: function(collection, queryObj, updateObj, callback){
            dbInstance.update(collection, queryObj, updateObj, callback);
        },
        delete: function(collectionName, queryObj, callback){
            dbInstance.delete(collectionName, queryObj, callback);
        },
        deleteMany: function(collectionName, queryObj, callback){
            dbInstance.deleteMany(collectionName, queryObj, callback);
        }
    }
})();

module.exports = database;


// var database = function () {
//     var self = this;
//     self.data = [
//         {
//             monthName: 'Jan',
//             monthNum: 0,
//             year: 2018,
//             startingBal: 1200.39,
//             transactions: [
//                 {
//                     transId: 0,
//                     transName: 'Walmart',
//                     transAmount: '15.90',
//                     transType: 'debit',
//                     transDate: new Date('1/5/18')
//                 },
//                 {
//                     transId: 1,
//                     transName: 'Kroger',
//                     transAmount: '1.34',
//                     transType: 'debit',
//                     transDate: new Date('1/8/18'
//                     )
//                 },
//                 {
//                     transId: 2,
//                     transName: 'Paycheckblahblahblah',
//                     transAmount: '200',
//                     transType: 'credit',
//                     transDate: new Date('1/15/18')
//                 },
//                 {
//                     transId: 3,
//                     transName: 'Coyote\'s',
//                     transAmount: '75.23',
//                     transType: 'debit',
//                     transDate: new Date('1/15/18')
//                 },
//             ]
//         },
//         {
//             monthName: 'Feb',
//             monthNum: 1,
//             year: 2018,
//             startingBal: 1200.39,
//             transactions: [
//                 {
//                     transId: 0,
//                     transName: 'Strippers',
//                     transAmount: '315.90',
//                     transType: 'debit',
//                     transDate: new Date('2/4/18')
//                 },
//                 {
//                     transId: 1,
//                     transName: 'Drugs',
//                     transAmount: '50.00',
//                     transType: 'debit',
//                     transDate: new Date('2/11/18')
//                 },
//                 {
//                     transId: 2,
//                     transName: 'Alcohol',
//                     transAmount: '27.39',
//                     transType: 'debit',
//                     transDate: new Date('2/13/18')
//                 },
//                 {
//                     transId: 3,
//                     transName: 'Munchies',
//                     transAmount: '19.89',
//                     transType: 'debit',
//                     transDate: new Date('2/15/18')
//                 },
//             ]
//         }
//     ]
//     self.getData = function (monthNum) {
//         return self.data[parseInt(monthNum)];
//     }
// }

// module.exports = database;