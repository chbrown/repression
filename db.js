/*jslint node: true */
var logger = require('loge');
var sqlcmd = require('sqlcmd');

var db = module.exports = new sqlcmd.Connection({
  host: '/tmp',
  database: process.env.database,
  user: process.env.USER,
});
