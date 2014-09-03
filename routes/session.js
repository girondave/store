var UsersDAO = require('../users').UsersDAO
  , SessionsDAO = require('../sessions').SessionsDAO;
var passport = require('passport');
var stormpath = require('stormpath');

/* The SessionHandler must be constructed with a connected db */
function SessionHandler (db) {
    "use strict";

    var users = new UsersDAO(db);
    var sessions = new SessionsDAO(db);

    // Initialize our Stormpath client.
        var apiKey = new stormpath.ApiKey(
          process.env['STORMPATH_API_KEY_ID'],
          process.env['STORMPATH_API_KEY_SECRET']
        );
        var spClient = new stormpath.Client({ apiKey: apiKey });



    //revisada
    this.isLoggedInMiddleware = function(req, res, next) {
        console.log("Ejecutando isLoggedInMiddleware");
        var session_id = req.cookies.session;
        sessions.getUsername(session_id, function(err, session) {
            "use strict";

            console.log("isLoggedInMiddleware. Respuesta de getUsername. \nError: " + err + ". Objeto: " + JSON.stringify(session));

            if (!err && session.email) {
                req.email = session.email;
            }
            return next();
        });
    }

    this.displayLoginPage = function(req, res, next) {
        "use strict";

        if(!req.user){
            return res.render("login", {email:"", password:"", login_error:req.flash('error')[0]});
        }else{
            res.redirect("/welcome");
        }
    }

    // revisado
    this.displayLogoutPage = function(req, res, next) {
        "use strict";

        req.logout();
        res.redirect('/');

    }

    this.displaySignupPage =  function(req, res, next) {
        "use strict";

        res.render('signup', {title: 'Registro de usuarios'
            , header: "Formulario de Registro"
            , email: ""
            , password: ""
            , extraButtons: "none"   
            , passwordForDetails: "password"
            , checkboxForDetails: null
            , typeForDetails: "text"        
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
            , extraButtons: null   
            , passwordForDetails: "hidden"
            , checkboxForDetails: "none"
            , disableForDetails: "disabled"
            , buttonFunction: "Guardar"
        });
    }

    function validateSignup(email, password, verify, firstname, lastname, gender, role, errors) {
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

        var email = req.body.username
        var password = req.body.password
        var firstname = req.body.firstname
        var lastname = req.body.lastname
        var verify = req.body.verify
        var gender = req.body.gender
        var role = req.body.role

        

        // set these up in case we have an error case
        var errors = {'email': email}
        if (validateSignup(email, password, verify, firstname, lastname, gender, role, errors)) {

            // Grab our app, then attempt to create this user's account.
            var app = spClient.getApplication(process.env['STORMPATH_APP_HREF'], function(err, app) {
                if (err) throw err;

                var account = {
                    givenName: firstname,
                    surname: lastname,
                    //username: 'tk421',
                    email: email,
                    password: password,
                    customData: {
                        gender: gender
                        //,birthdate: birthdate
                    },
                };

                app.createAccount(account, function (err, createdAccount) {
                    if (err) {
                        var error;
                        if (err.userMessage == "Account password minimum length not satisfied."){
                            error = "La contraseña es demasiado corta";
                        }else if (err.userMessage == "Password requires a lowercase character!"){
                            error = "La contraseña debe contener al menos una minúscula";
                        }else if (err.userMessage == "Password requires an uppercase character!"){
                            error = "La contraseña debe contener al menos una mayúscula";
                        }else if (err.userMessage == "Password requires a numeric character!"){
                            error = "La contraseña debe contener un número";
                        }

                        return res.render('signup', {title: 'Registro de usuarios'
                            , header: "Formulario de Registro"
                            , email: ""
                            , password: ""
                            , error: error
                            , extraButtons: "none"   
                            , passwordForDetails: "password"
                            , checkboxForDetails: null
                            , typeForDetails: "text"     
                            , buttonFunction: "Enviar"
                        });
                    } else {
                        var groupHref;
                        if(role==='Administrador'){
                            groupHref = 'https://api.stormpath.com/v1/groups/JY0cTX0Dgp7lICb4fQhe2';
                        }else if(role === 'Vendedor'){
                            groupHref = 'https://api.stormpath.com/v1/groups/7Dk0a4jo9bu3R6C9gSKTPy'; 
                        }
                        //via the account
                        //groupOrGroupHref may be the actual group or the group's href:
                        if(groupHref){
                            createdAccount.addToGroup(groupHref, function(err, membership) {
                              console.log(membership);
                            });
                        }
                        
                        res.redirect('/login');
                        
                    }
                  });
            });
        }
    }

    // revisado
    this.displayWelcomePage = function(req, res, next) {
        "use strict";
        console.log("username: " + req.user + " status: " + req.user.status);
        if (!req.user || req.user.status !== 'ENABLED') {
            console.log("No se ha identificado. Por favor, inicie sesión.");
            return res.redirect('/login');
        }else{
            res.render('welcome', {
                username: req.user
            });
        }
    }

    this.forgotPassword = function(req, res, next) {
        "use strict";

        var app = spClient.getApplication(process.env['STORMPATH_APP_HREF'], function(err, app) {
        if (err) throw err;

            var emailOrUsername = req.body.username;
            app.sendPasswordResetEmail(emailOrUsername, function (err, token) {
                if(err){
                    if(err.code == 404) res.err = "El correo es incorrecto";
                }
                console.log(token);
                console.log(res.err);
            });

            console.log('email: '+ emailOrUsername);
            //res.redirect('/login');
        });
    }

    
}

module.exports = SessionHandler;
