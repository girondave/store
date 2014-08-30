var bcrypt = require('bcrypt-nodejs');

/* The UsersDAO must be constructed with a connected database object */
function UsersDAO(db) {
    "use strict";

    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof UsersDAO)) {
        console.log('Warning: UsersDAO constructor called without "new" operator');
        return new UsersDAO(db);
    }

    var users = db.collection("users");

    this.addUser = function(email, password, firstname, lastname, gender, role, callback) {
        "use strict";

        // Generate password hash
        var salt = bcrypt.genSaltSync();
        var password_hash = bcrypt.hashSync(password, salt);

        // Create user document
        var user = {'_id': email
        , 'password': password_hash
        , 'firstname': firstname
        , 'lastname': lastname
        , 'gender': gender
        , 'role': role
        };

        users.insert(user, function(err, inserted) {

            if (err){
                return callback(err, null)
            }else{
                console.dir("Successfully inserted: " + JSON.stringify(inserted));
                callback(null,user);
            }
        });
    }

    this.validateLogin = function(username, password, callback) {
        "use strict";

        // Callback to pass to MongoDB that validates a user document
        function validateUserDoc(err, user) {
            "use strict";

            if (err) return callback(err, null);

            if (user) {
                if (bcrypt.compareSync(password, user.password)) {
                    callback(null, user);
                }
                else {
                    var invalid_password_error = new Error("Invalid password");
                    // Set an extra field so we can distinguish this from a db error
                    invalid_password_error.invalid_password = true;
                    callback(invalid_password_error, null);
                }
            }
            else {
                var no_such_user_error = new Error("User: " + user + " does not exist");
                // Set an extra field so we can distinguish this from a db error
                no_such_user_error.no_such_user = true;
                callback(no_such_user_error, null);
            }
        }

        users.findOne({"_id":username}, function(err, doc){
            validateUserDoc(err,doc);
        });
        
    }

    this.getAllUsers = function(email, callback){
        "use strict";

        users.find().toArray(function(err, items) {
            "use strict";

            if (err) return callback(err, null);

            console.log(items.length + " fueron encontrados");
            callback(err, items);
        });
    }

    

    //AQUI LA FUNCION PARA VALIDAR EL CORREO EN PASS RESET
    this.validatePassReset = function(email, callback) {
        "use strict";

        // Callback to pass to MongoDB that validates a user document
        function validateEmail(err, user) {
            "use strict";

            if (err) return callback(err, null);

            if (user) {
                if (bcrypt.compareSync(password, user.password)) {
                    callback(null, user);
                }
                else {
                    var invalid_password_error = new Error("Invalid password");
                    // Set an extra field so we can distinguish this from a db error
                    invalid_password_error.invalid_password = true;
                    callback(invalid_password_error, null);
                }
            }
            else {
                var no_such_user_error = new Error("User: " + user + " does not exist");
                // Set an extra field so we can distinguish this from a db error
                no_such_user_error.no_such_user = true;
                callback(no_such_user_error, null);
            }
        }

        users.findOne({"_id":username}, function(err, doc){
            validateEmail(err,doc);
        });
        
    }
}

module.exports.UsersDAO = UsersDAO;
