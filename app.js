var express = require('express')
  //variable path para accesar CSS
  , path = require('path')
  , app = express() // Web framework to handle routing requests
  //, cookieParser = require('cookie-parser')
  //, bodyParser = require('body-parser')
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
    app.use(express.cookieParser());

    // Express middleware to populate 'req.body' so we can access POST variables
    app.use(express.bodyParser());

    // Express middleware para usar CSS
    app.use(express.static(path.join(__dirname, 'public')));

    // Application routes
    routes(app, db);

    app.set('port', process.env.PORT || 5000);

    app.listen(app.get('port'));
    console.log('Express server listening on port ' + app.get('port'));
});
