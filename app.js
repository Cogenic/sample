var express = require('express');
var flash = require('connect-flash');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var JSAlert = require("js-alert");
//Authentication Packages
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var MySQLStore = require('express-mysql-session')(session);
var bcrypt = require('bcrypt');

require('dotenv').config();
var index = require('./routes/index');
var trainer = require('./routes/trainer');
var users = require('./routes/users');
var recognize = require('./src/recognize.js');
const fs = require('fs');
//var stream = require('./stream.js');
const app = express();
var https = require('https')
const server = https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('bundle.crt')
}, app)
.listen(8080, function () {
  console.log('Example app listening on port 3000! Go to https://localhost:3000/')
})
const ws = require('ws').Server;


const {Storage} = require('@google-cloud/storage');

// Instantiate a storage client
//
const storage = new Storage();
app.use(flash());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator())

const {format} = require('util');

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var options = {
    host: 'localhost',
    user: "Kirubel",
    password: "aiAdvantage",
    database : "login_info",
    port: '3305'
//    socketPath: '/cloudsql/cogenicintel:us-west4:reason'
};


var sessionStore = new MySQLStore(options);

app.use(session({
    //Normally use a random string generator to hassh your cookie
    secret: 'dfajdslkfjweajqn',
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookies: { secure:true }
}));

//To test whether our user is logged in
app.use(passport.initialize()); //Allow to different authentication strategies
app.use(passport.session());


app.use(function(req, res, next){
    res.locals.isAuthenticated = req.isAuthenticated();
    next();

});

//To create routs to allow for different pages
app.use('/', index); //creating a route
app.use('/training',trainer); //creating a route
app.use('/users', users);

//app.use(express.cookieParser('keyboard cat'));
//app.use(express.session({ cookie: { maxAge: 60000 }}));


passport.use(new LocalStrategy({
    passReqToCallback: true
    },
    function(req, username, password, done){
        console.log(username);
        console.log(password);
        const db = require('./db');
        db.query('SELECT password FROM entries WHERE username = ?', [username], function(err, results, fields){
                if(err) {done(err)}
                if(results.length===0){
                  return done(null, false, req.flash('message', 'Invalid username or password!'));
                }
                const hash = results[0].password.toString();
                bcrypt.compare(password, hash, function(err,response){
                    if(response===true){
                        return done(null, {user_id: results[0].entryID});//Unable to printout userId Fix soon
                    }else {
                        return done(null, false, req.flash('message', 'Invalid username or password!'));
                    }
               });
        });
//        return done(null, false, {message: 'Invalid username or password'}); //Tell user authentication was unsuccessful
    }
));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});
// Handlebars default config
const hbs = require('hbs');

const partialsDir = __dirname + '/views/partials';

const filenames = fs.readdirSync(partialsDir);

filenames.forEach(function (filename) {
    const matches = /^([^.]+).hbs$/.exec(filename);
    if (!matches) {
    return;
    }
    const name = matches[1];
    const template = fs.readFileSync(partialsDir + '/' + filename, 'utf8');
    hbs.registerPartial(name, template);
});

hbs.registerHelper('json', function(context) {
    return JSON.stringify(context, null, 2);
});





module.exports = app;
