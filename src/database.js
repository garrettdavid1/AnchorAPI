var config;
try{
    config = require('./appconfig.js');
} catch(err){
    config = null;
}

var database = (function () {
    var Database = function () {
        var self = this;
        self.db;
        this.connect = function(dbName, callback) {
            const MongoClient = require('mongodb').MongoClient;
            const assert = require('assert');

            // Connection URL
            const url = lib.mongoConnectionString(config);

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