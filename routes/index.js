var SessionHandler = require('./session')
  , ContentHandler = require('./content')
  , ErrorHandler = require('./error').errorHandler;

  var passport = require('passport');

module.exports = exports = function(app, db) {

    var sessionHandler = new SessionHandler(db);
    var contentHandler = new ContentHandler(db);

    // Middleware to see if a user is logged in
    app.use(sessionHandler.isLoggedInMiddleware);

    // The main page of the blog
    app.get('/', contentHandler.displayMainPage);

    // The main page of the blog, filtered by tag
    app.get('/tag/:tag', contentHandler.displayMainPageByTag);

    // A single post, which can be commented on
    app.get("/post/:permalink", contentHandler.displayPostByPermalink);
    app.post('/newcomment', contentHandler.handleNewComment);
    app.get("/post_not_found", contentHandler.displayPostNotFound);

    // Displays the form allowing a user to add a new post. Only works for logged in users
    app.get('/newpost', contentHandler.displayNewPostPage);
    app.post('/newpost', contentHandler.handleNewPost);

    // Login form
    app.get('/login', sessionHandler.displayLoginPage);
    //app.post('/login', sessionHandler.handleLoginRequest);
    app.post('/login', passport.authenticate('stormpath', {
            successRedirect: '/welcome',
            failureRedirect: '/login',
            failureFlash: 'Correo o contraseña inválida',
        })
    );

    // Logout page
    app.get('/logout', sessionHandler.displayLogoutPage);

    // Welcome page
    app.get("/welcome", sessionHandler.displayWelcomePage);

    // Signup form
    app.get('/signup', sessionHandler.displaySignupPage);
    app.post('/signup', sessionHandler.handleSignup);

    // User details
    app.get('/details', sessionHandler.displayDetailsPage);
    //app.post('/details', sessionHandler.handleUpdate);

    // Error handling middleware
    app.use(ErrorHandler);

    // No Site = Under construction
    app.get('/nosite', contentHandler.noSite);

    // Administracion de usuarios
    app.get('/useradmin', contentHandler.displayUsersInfo);

    //Forgot Password
    app.post('/forgot', sessionHandler.forgotPassword);
    
}
        