#!/usr/bin/env node
/*jslint node: true */
var path = require('path');
var url = require('url');
var http = require('http-enhanced');
var logger = require('loge');
var Cookies = require('cookies');

var config = require('./package').config;
process.env.port = process.env.npm_config_port || config.port;
process.env.hostname = process.env.npm_config_hostname || config.hostname;
process.env.database = process.env.npm_config_database || config.database;

// import db AFTER consolidating the config options above
var db = require('./db');
var schema_sql = path.join(__dirname, 'schema.sql');
// initialize it every time. Might as well.
db.initializeDatabase(schema_sql, function(err) {
  if (err) logger.error('Database initialization error: %s', err);
});

Cookies.prototype.defaults = function() {
  var expires = new Date(Date.now() + 31*86400*1000); // 1 month out
  return {path: '/', expires: expires};
};

// start server
var root_controller = require('./controllers');
http.createServer(function(req, res) {
  req.cookies = new Cookies(req, res);

  var started = Date.now();
  res.on('finish', function() {
    logger.debug('%s %s [%dms] (pid=%d)', req.method, req.url, Date.now() - started, process.pid);
  });

  // immediately strip access_token and convert to cookie if specified in the url
  var urlObj = url.parse(req.url, true);
  if (urlObj.query.access_token) {
    req.cookies.set('access_token', urlObj.query.access_token);
    delete urlObj.search; // overrides query if present
    delete urlObj.query.access_token;

    return res.redirect(url.format(urlObj));
  }

  root_controller(req, res);
}).listen(process.env.port, process.env.hostname, function() {
  logger.info('listening on http://%s:%d', process.env.hostname, process.env.port);
});
