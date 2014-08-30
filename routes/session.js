var UsersDAO = require('../users').UsersDAO
  , SessionsDAO = require('../sessions').SessionsDAO;

/* The SessionHandler must be constructed with a connected db */
function SessionHandler (db) {
    "use strict";

    var users = new UsersDAO(db);
    var sessions = new SessionsDAO(db);

    this.isLoggedInMiddleware = function(req, res, next) {
        var session_id = req.cookies.session;
        sessions.getUsername(session_id, function(err, email) {
            "use strict";

            if (!err && email) {
                req.email = email;
            }
            return next();
        });
    }

    this.displayLoginPage = function(req, res, next) {
        "use strict";
        return res.render("login", {email:"", password:"", login_error:""})
    }

    this.handleLoginRequest = function(req, res, next) {
        "use strict";

        var email = req.body.email;
        var password = req.body.password;

        console.log("user submitted email: " + email + " pass: " + password);

        users.validateLogin(email, password, function(err, user) {
            "use strict";

            if (err) {
                if (err.no_such_user) {
                    return res.render("login", {email:email, password:"", login_error:"El usuario no existe"});
                }
                else if (err.invalid_password) {
                    return res.render("login", {email:email, password:"", login_error:"La contraseña es inválida"});
                }
                else {
                    // Some other kind of error
                    return next(err);
                }
            }

            sessions.startSession(user['_id'], function(err, session_id) {
                "use strict";

                if (err) return next(err);

                res.cookie('session', session_id);
                return res.redirect('/welcome');
            });
        });
    }

    this.displayLogoutPage = function(req, res, next) {
        "use strict";

        var session_id = req.cookies.session;
        sessions.endSession(session_id, function (err) {
            "use strict";

            // Even if the user wasn't logged in, redirect to home
            res.cookie('session', '');
            return res.redirect('/');
        });
    }

    this.displaySignupPage =  function(req, res, next) {
        "use strict";
        res.render("signup", {title: "Registro de usuarios"
            , header: "Formulario de Registro"
            , email: ""
            , password: ""
            , password_error: ""
            , email_error: ""
            , verify_error: ""
            , extraButtons: "none"   
            , passwordForDetails: "password"
            , checkboxForDetails: null
            , typeForDetails: "text"         
            //, disableForDetails: "none"
            , buttonFunction: "Enviar"
        });
    }

this.displayDetailsPage =  function(req, res, next) {
        "use strict";
        res.render("signup", {title: "Detalles de usuario"
            , header: "Detalles"
            , email: req.email
            , firstname: req.firstname
            , lastname: req.lastname
            , gender: req.gender
            , role: req.role
            , verify_error: ""
            , extraButtons: null   
            , passwordForDetails: "hidden"
            , checkboxForDetails: "none"
            , disableForDetails: "disabled"
            , buttonFunction: "Guardar"
        });
    }

    function validateSignup(email, password, verify, firstname, lastname, gender, role, errors) {
        //email, password, verify, errors) {
        "use strict";
        var PASS_RE = /^.{3,20}$/;
        var EMAIL_RE = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        errors['password_error'] = "";
        errors['verify_error'] = "";
        errors['email_error'] = "";

        if (gender==0) {
            errors['gender_error'] = "Género no seleccionado";
            return false;
        }
        if (!PASS_RE.test(password)) {
            errors['password_error'] = "Contraseña no válida";
            return false;
        }
        if (role==0) {
            errors['role_error'] = "Rol no seleccionado";
            return false;
        }
        if (password != verify) {
            errors['verify_error'] = "Las contraseñas deben coincidir";
            return false;
        }
        if (!EMAIL_RE.test(email)) {
            errors['email_error'] = "Correo no válido";
            return false;
        }
        return true;
    }

    this.handleSignup = function(req, res, next) {
        "use strict";

        var email = req.body.email
        var password = req.body.password
        var firstname = req.body.firstname
        var lastname = req.body.lastname
        var verify = req.body.verify
        var gender = req.body.gender
        var role = req.body.role


        // set these up in case we have an error case
        var errors = {'email': email}
        if (validateSignup(email, password, verify, firstname, lastname, gender, role, errors)) {
            users.addUser(email, password, firstname, lastname, gender, role, function(err, user) {
                "use strict";

                if (err) {
                    // this was a duplicate
                    if (err.code == '11000') {
                        return res.render("signup", {title: "Registro de usuarios"
            , header: "Formulario de Registro"
            , email: ""
            , password: ""
            , password_error: ""
            , email_error: "El correo ya está en uso"
            , verify_error: ""
            , typeForDetails: "text"            
            , disableForDetails: null
            , buttonFunction: "Enviar"
        });
                    }
                    // this was a different error
                    else {
                        return next(err);
                    }
                }

                sessions.startSession(user['_id'], function(err, session_id) {
                    "use strict";

                    if (err) return next(err);

                    res.cookie('session', session_id);
                    return res.redirect('/welcome');
                });
            });
        }
        else {
            console.log("user did not validate");
            return res.render("signup", errors);
        }
    }

    this.displayWelcomePage = function(req, res, next) {
        "use strict";

        if (!req.email) {
            console.log("Bienvenido: no se ha identificado. Por favor, inicie sesión.");
            return res.redirect("/signup");
        }

        return res.render("welcome", {'email':req.email})
    }

    this.emailExists = function(req, res, next) {
        "use strict";

        var email = req.email;
        
        console.log("user submitted email: " + email);

        //AQUI TENGO QUE LLAMAR A LA FUNCION EN USERS ROOT PARA VALIDAR EL CORREO! (CAMBIAR NOMBRE A FUNCION)
        users.validateLogin(email, function(err, user) {
            "use strict";

            if (err) {
                if (err.no_such_user) {
                    return res.render("login", {email:email, login_error:"El usuario no existe"});
                }
                
                else {
                    // Some other kind of error
                    return next(err);
                }
            }
            //LLAMAR A LA FUNCION PARA MANDAR EL CORREO EN SESSIONS EN ROOT (CAMBIAR EL NOMBRE A LA FUNCION)
            sessions.startSession(user['_id'], function(err, session_id) {
                "use strict";

                if (err) return next(err);

                res.cookie('session', session_id);
                return res.redirect('/welcome');
            });
        });
    }
}

module.exports = SessionHandler;
