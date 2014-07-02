#!/usr/bin/env node
/*jslint node: true */
var path = require('path');
var http = require('http-enhanced');
var logger = require('loge');

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

// start server
var root_controller = require('./controllers');
http.createServer(function(req, res) {
  logger.info('%s %s', req.method, req.url);
  root_controller(req, res);
}).listen(process.env.port, process.env.hostname, function() {
  logger.info('listening on http://%s:%d', process.env.hostname, process.env.port);
});

