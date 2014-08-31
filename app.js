var express = require('express')
  //variable path para accesar CSS
  , path = require('path')
  //variable nodemailer para enviar email
  , nodemailer = require("nodemailer")

  , app = express() // Web framework to handle routing requests
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
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

    // Express middleware to populate 'req.cookies' so we can access cookies
    app.use(express.cookieParser('CaballoTiburon'));
    // Para poder utilizar sesiones en linea, expira en 15 minutos
    var cookieOptions = {cookie:{ maxAge: 15 * 60 * 1000 }};
    app.use(express.session(cookieOptions));
    // Express middleware to populate 'req.body' so we can access POST variables
    app.use(express.bodyParser());

    //Necesarios para utilizar nodemailer
    app.use(express.methodOverride());

    app.use(app.router);

    // Express middleware para usar CSS
    app.use(express.static(path.join(__dirname, 'public')));

    // Application routes
    routes(app, db);

    // Configurando puerto: variable PORT (heroku) o 5000 (local)
    app.set('port', process.env.PORT || 5000);
    // Escuchar en puerto
    app.listen(app.get('port'));
    console.log('Express server listening on port ' + app.get('port'));
});
