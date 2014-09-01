var crypto = require('crypto');

/* The SessionsDAO must be constructed with a connected database object */
function SessionsDAO(db) {
    "use strict";

    /* If this constructor is called without the "new" operator, "this" points
     * to the global object. Log a warning and call it correctly. */
    if (false === (this instanceof SessionsDAO)) {
        console.log('Warning: SessionsDAO constructor called without "new" operator');
        return new SessionsDAO(db);
    }

    var sessions = db.collection("sessions");

    // Limpiar la coleccion sessions si hay mas de X registros
    this.sessionCleaner = function() {

        sessions.find().count(function(err, count){
            if (err) console.log("Hubo error de conteo");
            console.log("Conteo: " + count);
            if (count > 500){
                sessions.remove(function (err, mess){
                    if (err){
                        console.log("Error al remover coleccion");
                    }else{
                        console.log("Se borro la coleccion");
                    }
                });
            }
        });
    }

    this.startSession = function(username, firstname, lastname, role, callback) {
        "use strict";

        // Generate session id
        var current_date = (new Date()).valueOf().toString();
        var random = Math.random().toString();
        var session_id = crypto.createHash('sha1').update(current_date + random).digest('hex');

        // Create session document
        var session = {'username': username, '_id': session_id, 'firstname': firstname, 'lastname': lastname, 'logged':true, 'role':role};

        // Insert session document
        sessions.insert(session, function (err, result) {
            "use strict";
            callback(err, session_id);
        });
    }

    // revisado
    this.endSession = function(session_id, callback) {
        "use strict";
        // Remove session document
        sessions.remove({ '_id' : session_id }, function (err, numRemoved) {
            "use strict";
            callback(err);
        });
    }

    // revisada
    this.getUsername = function(session_id, callback) {
        "use strict";

        if (!session_id) {
            console.log("No existe sesion");
            callback(Error("No ha iniciado sesión"), null);
            return;
        }

        sessions.findOne({ '_id' : session_id }, function(err, session) {
            "use strict";

            if (err) return callback(err, null);

            if (!session) {
                callback(new Error("La sesión: " + session + " no existe"), null);
                return;
            }

            callback(null, session);
        });
    }

   
}


module.exports.SessionsDAO = SessionsDAO;
