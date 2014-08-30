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

    this.startSession = function(username, role, callback) {
        "use strict";

        // Generate session id
        var current_date = (new Date()).valueOf().toString();
        var random = Math.random().toString();
        var session_id = crypto.createHash('sha1').update(current_date + random).digest('hex');

        // Create session document
        var session = {'username': username, '_id': session_id, 'logged':true, 'role':role}

        // Insert session document
        sessions.insert(session, function (err, result) {
            "use strict";
            callback(err, session_id);
        });
    }

    this.endSession = function(session_id, callback) {
        "use strict";
        // Remove session document
        sessions.logged = false;
        sessions.remove({ '_id' : session_id }, function (err, numRemoved) {
            "use strict";
            callback(err);
        });
    }
    this.getUsername = function(session_id, callback) {
        "use strict";

        if (!session_id) {
            callback(Error("Session not set"), null);
            return;
        }

        sessions.findOne({ '_id' : session_id }, function(err, session) {
            "use strict";

            if (err) return callback(err, null);

            if (!session) {
                callback(new Error("Session: " + session + " does not exist"), null);
                return;
            }

            callback(null, session.username);
        });
    }

    this.SendEmail = function(email, callback) {
        "use strict";
        var keylist="abcdefghijklmnopqrstuvwxyz123456789"
        var recoverypass=''

        this.generatepass=function(){
        recoverypass=''
        for (i=0;i<8;i++)
        recoverypass+=keylist.charAt(Math.floor(Math.random()*keylist.length))
        return recoverypass
    }

        var smtpTransport = nodemailer.createTransport("SMTP",{
      service: "hotmail",
      auth: {
      user: "webappfpi@hotmail.com",
      pass: "Appadmin"
    }
  });


  var mailOptions = {
    from: "webappfpi<webappfpi@hotmail.com>", // sender address
    to: email, // list of receivers
    subject: "Recuperación de contraseña", // Subject line
    html: recoverypass // html body
  }

                    
  smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
      res.send("ocurrio un error, intentalo mas tarde");
    }else{
      res.send("email enviado con exito")
    }

  });   
  

  res.send("El email no se valido Volver")  

    }
}


module.exports.SessionsDAO = SessionsDAO;
