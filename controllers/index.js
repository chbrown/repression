/*jslint node: true */
var async = require('async');
var fs = require('fs');
var path = require('path');
var url = require('url');

var _ = require('lodash');
var send = require('send');
var logger = require('loge');
var Router = require('regex-router');

var liwc = require('../liwc');
var db = require('../db');

var static_root = path.join(__dirname, '..', 'static');
var R = new Router(function(req, res) {
  send(req, 'layout.html').root(static_root).on('error', function(err) {
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
// R.get(/^\/repression.user.js/, function(req, res, m) {
//   var download = function(user) {
//     // user has .email, .expires, and .repress properties
//     var userscript_path = path.join(__dirname, '..', 'repression.user.js');
//     fs.readFile(userscript_path, {encoding: 'utf8'}, function(err, userscript_template) {
//       if (err) return res.die(err);

//       var config_json = JSON.stringify(user);
//       var userscript = userscript_template.replace('CONFIG_JSON', config_json);

//       res.writeHead(200, {
//         'Content-Type': 'text/plain',
//         'Content-Disposition': 'attachment; filename=repression.user.js',
//       });
//       res.write(userscript);
//       res.end();
//     });
//   };

//   var urlObj = url.parse(req.url, true);
//   db.Insert('users')
//   .set({
//     email: urlObj.query.email,
//     expires: urlObj.query.expires,
//     repress: _.sample(['posemo', 'negemo']),
//   })
//   .execute(function(err) {
//     // ignore UNIQUE collisions
//     if (err && err.code != '23505') return res.die('Error: ' + err.toString());

//     db.Select('users')
//     .whereEqual({email: urlObj.query.emaill})
//     .execute(function(err, rows) {
//       if (err) return res.die(err);
//       download(rows[0]);
//     });
//   });
// });

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

Given a JSON array of {author: String, text: String} objects, determine which
of them should be repressed. Returns a list of bools exactly as long as the
list of objects received.

We don't need any fancy CORS since it'll be accessed only by the interface.html iframe.

*/
R.post(/^\/repress/, function(req, res, m) {
  var username = req.headers['x-username'];
  if (!username) res.die('You must supply a username via the "x-username" header');

  async.auto({
    data: function(callback) {
      req.readData(callback);
    },
    user: function(callback) {
      db.Select('users')
      .whereEqual({username: username})
      .execute(function(err, rows) {
        if (err) return callback(err);

        if (rows.length === 0) {
          logger.info('no user could be found with the username "%s"; creating one', username);

          var one_week_from_now = new Date(new Date().getTime() + (7 * 86400 * 1000));

          db.Insert('users')
          .set({
            username: username,
            repress: _.sample(['posemo', 'negemo']),
            expires: one_week_from_now,
          })
          .execute(function(err, rows) {
            if (err) return callback(err);

            callback(null, rows[0]);
          });
        }
        else {
          callback(null, rows[0]);
        }
      });
    },
  }, function(err, payload) {
    if (err) return res.die(err);
    if (!Array.isArray(payload.data)) return res.die('/repress only accepts an array of strings');
    // payload is an object: {data: ..., user: Object}

    var posts = []; // just the repressed ones
    var repressions = payload.data.map(function(datum) {
      // returns a list of booleans: whether or not to show the given post
      var author = String(datum.author);
      var content = String(datum.content);

      var matches = liwc.matches(content);
      var match = matches[payload.user.repress];
      logger.debug('%s in "%s"? %s', payload.user.repress, content, match[0]);
      if (match) {
        posts.push({
          user_id: payload.user.id,
          author: author,
          content: content,
          match: match[0],
        });
        return true;
      }
      return !!match;
    });
    res.json(repressions);

    // to do this will a single INSERT () VALUES (), (), (), ...; command
    async.each(posts, function(post, callback) {
      db.Insert('posts').set(post).execute(callback);
    }, function(err) {
      if (err) logger.error(err);
    });
  });
});


/**
For example:

GET /results?username=io@henrian.com&expires=2014-07-11T21:39:17.863Z
*/
R.get(/^\/results.json/, function(req, res, m) {
  var urlObj = url.parse(req.url, true);
  db.Select('posts JOIN users ON users.id = posts.user_id')
  .where('users.username = ?', urlObj.query.username)
  .limit(200)
  .orderBy('posts.created DESC')
  .execute(function(err, rows) {
    if (err) return res.die(err);
    res.ngjson(rows);
  });
});

module.exports = R.route.bind(R);
