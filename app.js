var express = require('express')

  // Variable path para accesar CSS
  , path = require('path')

  // new Passport/Stormpath session Manager
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , passport = require('passport')
  , StormpathStrategy = require('passport-stormpath')
  , session = require('express-session')
  , flash = require('connect-flash');

  // Passport Strategy
var strategy = new StormpathStrategy();
  passport.use(strategy);
  passport.serializeUser(strategy.serializeUser);
  passport.deserializeUser(strategy.deserializeUser);

  // Session
var cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')

  // Se usara???
  // Variable nodemailer para enviar email
  , nodemailer = require("nodemailer")

  , app = express() // Web framework to handle routing requests

  , cons = require('consolidate') // Templating library adapter for Express
  , MongoClient = require('mongodb').MongoClient // Driver for connecting to MongoDB
  , routes = require('./routes'); // Routes for our application









MongoClient.connect('mongodb://admin:admin@kahana.mongohq.com:10043/webapp', function(err, db) {
    "use strict";
    if(err) throw err;

    // Register our templating engine
    app.engine('html', cons.swig);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/views');

    // Para poder utilizar sesiones en linea, expira en X minutos
    var cookieOptions = { secure:false, maxAge: 0.2 * 60 * 1000 };

    //Passport and Stormpath
    app.use(favicon(__dirname + '/public/img/favicon.ico'));
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(cookieParser());
    app.use(require('stylus').middleware(path.join(__dirname, 'public')));
    app.use(express.static(path.join(__dirname, 'public')));

    app.use(session({
      secret: process.env.EXPRESS_SECRET,
      key: 'sid',
      saveUninitialized: true,
      resave: true,
      cookie: cookieOptions
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());

    /*
    // Express middleware to populate 'req.cookies' so we can access cookies
    app.use(express.cookieParser('CaballoTiburon'));
    // Para poder utilizar sesiones en linea, expira en 15 minutos
    var cookieOptions = {cookie:{ maxAge: 0.2 * 60 * 1000 }};
    app.use(express.session(cookieOptions));
    // Express middleware to populate 'req.body' so we can access POST variables
    app.use(express.bodyParser());
    //Necesarios para utilizar nodemailer
    app.use(express.methodOverride());
    // Express middleware para usar CSS
    app.use(express.static(path.join(__dirname, 'public')));
    */

    app.use(app.router);

    // Application routes
    routes(app, db);

    // Configurando puerto: variable PORT (heroku) o 5000 (local)
    app.set('port', process.env.PORT || 5000);

    // Escuchar en puerto
    app.listen(app.get('port'));
    console.log('Express server listening on port ' + app.get('port'));
});
