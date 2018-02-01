userHandler = (function () {
    var UserController = function () {
        var self = this;

        self.newUser = function(userName, password, email){
            var now = new Date();
            return {
                'userName': userName,
                'password': password,
                'email': email,
                'createDateTimeUTC': new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds()))
            };
        }

        self.getUser = function(userId, callback){
            db.get('User', {'userId': userId}, null, function(result){
                lib.handleResult(result[0], callback);
            });
        };

        self.getUserByEmail = function(email, callback){
            db.get('User', {'email': email}, null, function(result){
                lib.handleResult(result[0], callback);
            });
        };

        self.createUser = function(user, callback){
            db.add('User', user, function(result){
                var user = result.ops[0];
                if(lib.exists(user)){
                    lib.handleResult({'result': 'success', 'user': {'userName': user.userName, 'userId': user._id}}, callback);
                }else{
                    lib.handleResult({ 'result': 'failure', 'message': 'Incorrect email or password.' }, callback);
                }
            });
        };

        self.updateUser = function(userId, updateObj, callback){
             db.update('User', {'userId': userId}, updateObj, function(result){
                 lib.handleResult(result, callback);
             })
        };

        self.deleteUser = function(userId, callback){
            db.delete('User', {'userId': userId}, function(result){
                lib.handleResult(result, callback);
            })
        };
    }

    var userController;

    return {
        init: function(){
            userController = new UserController();
        },
        getUserByEmail: function(email, callback){
            return userController.getUserByEmail(email, callback);
        },
        getUser: function(userId, callback){
            return userController.getUser(userId, callback);
        },
        createUser: function(user, callback){
            return userController.createUser(user, callback);
        },
        updateUser: function(userId, updateObj, callback){
            return userController.updateUser(userId, updateObj, callback);
        },
        deleteUser: function(userId, callback){
            return userController.deleteUser(userId, callback);
        },
        newUser: function(userName, password, email){
            return userController.newUser(userName, password, email);
        }
    }
})();

module.exports = userHandler;