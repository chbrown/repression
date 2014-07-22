/*jslint node: true */
var async = require('async');
var url = require('url');
var Router = require('regex-router');

var db = require('../db');

var R = new Router(function(req, res) {
  res.status(404).die('No resource found');
});

/**
GET /repression/admin/users.json
Return all active users. Should only be reachable by an administrator.
*/
R.get(/^\/repression\/admin\/users.json/, function(req, res) {
  db.query('SELECT users.*, COUNT(posts.id) as total FROM users LEFT JOIN posts ON posts.user_id = users.id GROUP BY users.id ORDER BY users.id',
    [], function(err, rows) {
    if (err) return res.die(err);

    res.ngjson(rows);
  });
});

module.exports = function(req, res) {
  var access_token = req.cookies.get('access_token');

  db.Select('users')
  .whereEqual({access_token: access_token, administrator: true})
  .where('access_token IS NOT NULL')
  .limit(1)
  .execute(function(err, rows) {
    if (!err && rows.length > 0) {
      R.route(req, res);
    }
    else {
      res.die('Unauthorized admin access');
    }
  });
};
