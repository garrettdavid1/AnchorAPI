var bcrypt = require('bcrypt');
const saltRounds = 10;

accountHandler = (function () {
    var AccountController = function () {
        var self = this;

        self.registerUser = function(userName, password, email, callback){
            bcrypt.hash(password, saltRounds, function(err, hash) {
                var user = userCtrl.newUser(userName, hash, email);
                userCtrl.createUser(user, callback);
              });
        };

        self.login = function(email, password, callback){
            userCtrl.getUserByEmail(email, function (result) {
                if(lib.exists(result)){
                    var user = result;
                    bcrypt.compare(password, user.password, function (err, res) {
                        if (res === true) {
                            lib.handleResult({'result': 'success', 'user': {'userName': user.userName, 'userId': user._id}}, callback);
                        } else {
                            lib.handleResult({ 'result': 'failure', 'message': 'Incorrect email or password.' }, callback);
                        }
                    });
                }else{
                    lib.handleResult({ 'result': 'failure', 'message': 'Incorrect email or password.' }, callback);
                }
                
            });
        }
    }

    var accountController;

    return {
        init: function(){
            accountController = new AccountController();
        },
        registerUser: function(userName, password, email, callback){
            return accountController.registerUser(userName, password, email, callback);
        },
        login: function(email, password, callback){
            return accountController.login(email, password, callback);
        }
    }
})();

module.exports = accountHandler;