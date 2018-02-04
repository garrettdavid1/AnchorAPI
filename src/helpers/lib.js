libHandler = (function () {
    var Library = function () {
        var self = this;

        self.exists  = function(variable){
            return (variable !== null && variable !== undefined);
        };

        self.handleResult = function(obj, callback){
            if(self.exists(callback)){
                callback(obj);
            } else{
                return obj;
            }
        }

    }

    var lib;

    return {
        init: function(){
            lib = new Library();
        },
        exists: function(variable){
            return lib.exists(variable);
        },
        handleResult: function(obj, callback){
            return lib.handleResult(obj, callback);
        },
        sessionSecret: function(config){
            return lib.exists(config) ? config.sessionSecret : process.env['SESSION_SECRET'];
        },
        mongoConnectionString: function(config){
            return lib.exists(config) ? config.mongoConnectionString : process.env['MONGO_CONNECTION_STRING'];
        }
    }
})();

module.exports = libHandler;