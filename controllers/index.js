/*jslint node: true */
var async = require('async');
var fs = require('fs');
var path = require('path');
var url = require('url');

var _ = require('lodash');
var send = require('send');
var logger = require('loge');
var Router = require('regex-router');

var match = require('../match');
var db = require('../db');

var static_root = path.join(__dirname, '..', 'static');
var R = new Router(function(req, res) {
  send(req, 'index.html').root(static_root).on('error', function(err) {
    res.status(err.status || 500).die('static error: ' + err.message);
  }).pipe(res);
});

// expose other /static files
R.get(/^\/static\/([^?]+)(\?|$)/, function(req, res, m) {
  send(req, m[1]).root(static_root).on('error', function(err) {
    res.status(err.status || 500).die('static error: ' + err.message);
  }).on('directory', function() {
    res.status(404).die('No resource at: ' + req.url);
  }).pipe(res);
});

/**
For example:

GET /repression.user.js?email=io@henrian.com&expires=2014-07-11T21:39:17.863Z
*/
R.get(/^\/repression.user.js/, function(req, res, m) {
  var download = function(user) {
    // user has .email, .expires, and .repress properties
    var userscript_path = path.join(__dirname, '..', 'repression.user.js');
    fs.readFile(userscript_path, {encoding: 'utf8'}, function(err, userscript_template) {
      if (err) return res.die(err);

      var config_json = JSON.stringify(user);
      var userscript = userscript_template.replace('CONFIG_JSON', config_json);

      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename=repression.user.js',
      });
      res.write(userscript);
      res.end();
    });
  };

  var urlObj = url.parse(req.url, true);
  db.Insert('users')
  .set({
    email: urlObj.query.email,
    expires: urlObj.query.expires,
    repress: _.sample(['posemo', 'negemo']),
  })
  .execute(function(err) {
    // ignore UNIQUE collisions
    if (err && err.code != '23505') return res.die('Error: ' + err.toString());

    db.Select('users')
    .whereEqual({email: urlObj.query.emaill})
    .execute(function(err, rows) {
      if (err) return res.die(err);
      download(rows[0]);
    });
  });
});

/** GET /interface.html

This is the CORS enabler, and communicates with the userscript
sitting on the Facebook homepage via window.postMessage between the iframe,
which loaded interface.html, and the iframe's parent page, Facebook.
*/
R.get(/^\/interface.html/, function(req, res, m) {
  send(req, 'interface.html').root(static_root).on('error', function(err) {
    res.status(err.status || 500).die('static error: ' + err.message);
  }).pipe(res);
});


/** POST /repress

Given a JSON list of strings, determine which of them should be repressed.

*/
R.post(/^\/repress/, function(req, res, m) {
  var user_id = req.headers['x-userid'];
  var repress_category = req.headers['x-repress'];
  req.readData(function(err, data) {
    if (err) return res.die(err);
    if (!Array.isArray(data)) return res.die('/repress only accepts an array of strings');

    var repressed_contents = [];
    var repressions = data.map(function(datum) {
      // returns a list of booleans: whether or not to show the given post
      var string = String(datum);
      logger.info('matching string: %s', string, Object.keys(match.match(string)));
      if (match.match(string)[repress_category]) {
        repressed_contents.push(string);
        return true;
      }
      else {
        return false;
      }
    });
    res.json(repressions);

    // to do this will a single INSERT () VALUES (), (), (), ...; command
    async.each(repressed_contents, function(content, callback) {
      db.Insert('posts')
      .set({user_id: user_id, content: content})
      .execute(callback);
    }, function(err) {
      if (err) logger.error(err);
    });
  });
});


module.exports = R.route.bind(R);
