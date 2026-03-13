require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var SequelizeStore = require('connect-session-sequelize')(session.Store);
var { Sequelize } = require('sequelize');
var expressLayouts = require('express-ejs-layouts');
var sessaoData = require('./middlewares/sessaoData');

var indexRouter = require('./routes/index');
var eventsRouter = require('./routes/events');
var callbackRouter = require('./routes/callback');
var apiRouter = require('./routes/api');
var inventarioRouter = require('./routes/inventario');
var comprarRouter = require('./routes/comprar');
var entradaRouter = require('./routes/entrada');
var saidaRouter = require('./routes/saida');
var pedidosRouter = require('./routes/pedidos');
var historicoRouter = require('./routes/historico');
var processoRouter = require('./routes/processo');
var eventsRouter = require('./routes/events');

var app = express();

// Sincroniza tabelas
require('./models').sequelize.sync({ alter: true });

function parseBool(value, fallback) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
}

function parseIntWithFallback(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

var dbName = process.env.DB_NAME || 'estoqueDB';
var dbUser = process.env.DB_USER || 'estoqueUser';
var dbPassword = process.env.DB_PASSWORD || '';
var dbHost = process.env.DB_HOST || '127.0.0.1';
var dbPort = parseIntWithFallback(process.env.DB_PORT, 3306);
var dbDialect = process.env.DB_DIALECT || 'mysql';

var sessionSecret = process.env.SESSION_SECRET;
var sessionCookieName = process.env.SESSION_COOKIE_NAME || 'TaiksuEstoqueCookie';
var sessionCookieMaxAge = parseIntWithFallback(process.env.SESSION_COOKIE_MAX_AGE_MS, 2 * 60 * 60 * 1000);
var sessionCookieHttpOnly = parseBool(process.env.SESSION_COOKIE_HTTP_ONLY, true);
var sessionCookieSecure = parseBool(process.env.SESSION_COOKIE_SECURE, true);
var sessionCookieSameSite = process.env.SESSION_COOKIE_SAME_SITE || 'lax';
var trustProxy = parseIntWithFallback(process.env.APP_TRUST_PROXY, 1);

// Cria a conexão com o banco
var sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPassword,
  { 
    dialect: dbDialect,
    host: dbHost,
    port: dbPort,
    logging: false 
  }
);

// Cria o store para sessões
var store = new SequelizeStore({
  db: sequelize,
});


// Ignora proxy reverso
app.set('trust proxy', trustProxy);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuração da sessão depois do arquivos estaticos
app.use(
  session({
    secret: sessionSecret,
    store: store,   
    name: sessionCookieName,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      maxAge: sessionCookieMaxAge,
      httpOnly: sessionCookieHttpOnly,
      secure: sessionCookieSecure,
      sameSite: sessionCookieSameSite
    } 
  })
);

// Sincroniza session no banco
store.sync();

app.use('/callback', callbackRouter);
app.use('/events', eventsRouter);
app.use('/api', apiRouter);

app.use(sessaoData);
app.use('/', indexRouter);
app.use('/inventario', inventarioRouter);
app.use('/comprar', comprarRouter);
app.use('/entrada', entradaRouter);
app.use('/saida', saidaRouter);
app.use('/pedidos', pedidosRouter);
app.use('/historico', historicoRouter);
app.use('/processo', processoRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : err;

  // render the error page
  res.status(err.status || 500);
  res.render('error', { title: 'Ooops!' });
});

module.exports = app;