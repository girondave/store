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
                    return res.render("login", {email:email, password:"", login_error:"No such user"});
                }
                else if (err.invalid_password) {
                    return res.render("login", {email:email, password:"", login_error:"Invalid password"});
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
        res.render("signup", {email:"", password:"",
                                    password_error:"",
                                    email_error:"",
                                    verify_error :""});
    }

    function validateSignup(email, password, verify, errors) {
        "use strict";
        var PASS_RE = /^.{3,20}$/;
        var EMAIL_RE = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        errors['password_error'] = "";
        errors['verify_error'] = "";
        errors['email_error'] = "";

        if (!PASS_RE.test(password)) {
            errors['password_error'] = "invalid password.";
            return false;
        }
        if (password != verify) {
            errors['verify_error'] = "password must match";
            return false;
        }
        console.log(EMAIL_RE.test(email));
        console.log(email);
        if (!EMAIL_RE.test(email)) {
                errors['email_error'] = "invalid email address";
                return false;
        }
        return true;
    }

    this.handleSignup = function(req, res, next) {
        "use strict";

        var email = req.body.email
        console.log('req.body.email = ' + email);
        //var email = req.body.email
        var password = req.body.password
        var verify = req.body.verify

        // set these up in case we have an error case
        var errors = {'email': email}
        if (validateSignup(email, password, verify, errors)) {
            users.addUser(email, password, function(err, user) {
                "use strict";

                if (err) {
                    // this was a duplicate
                    if (err.code == '11000') {
                        errors['email_error'] = "email already in use. Please choose another";
                        return res.render("signup", errors);
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
            console.log("welcome: can't identify user...redirecting to signup");
            return res.redirect("/signup");
        }

        return res.render("welcome", {'email':req.email})
    }
}

module.exports = SessionHandler;
