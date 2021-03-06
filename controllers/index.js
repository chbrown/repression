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
R.get(/^\/repression\/static\/([^?]+)(\?|$)/, function(req, res, m) {
  send(req, m[1]).root(static_root).on('error', function(err) {
    res.status(err.status || 500).die('static error: ' + err.message);
  }).on('directory', function() {
    res.status(404).die('No resource at: ' + req.url);
  }).pipe(res);
});

var createUser = function(username, callback) {
  var one_week_from_now = new Date(new Date().getTime() + (7 * 86400 * 1000));
  db.Insert('users')
  .set({
    username: username,
    repress: _.sample(['posemo', 'negemo']),
    expires: one_week_from_now,
  })
  .execute(callback);
  // maybe ignore UNIQUE collisions?
  // if (err && err.code != '23505') return res.die('Error: ' + err.toString());
};

/** GET /repression/interface.html

This is the CORS enabler, and communicates with the userscript
sitting on the Facebook homepage via window.postMessage between the iframe,
which loaded interface.html, and the iframe's parent page, Facebook.
*/
R.get(/^\/repression\/interface.html/, function(req, res, m) {
  var urlObj = url.parse(req.url, true);
  var username = urlObj.query.username;
  if (!username) res.die('You must supply a username via "?username=" querystring');

  db.Select('users')
  .whereEqual({username: username})
  .execute(function(err, rows) {
    if (err) return res.die(err);

    if (rows.length === 0) {
      createUser(username, function(err) {
        if (err) logger.error('Error creating user; %s', err.toString());
      });
    }
  });

  send(req, 'interface.html').root(static_root).on('error', function(err) {
    res.status(err.status || 500).die('static error: ' + err.message);
  }).pipe(res);
});


/** POST /repress

Given a JSON array of {author: String, content: String} objects, determine which
of them should be repressed. Returns a list of bools exactly as long as the
list of objects received.

We don't need any fancy CORS since it'll be accessed only by the interface.html iframe.

*/
R.post(/^\/repression\/repress/, function(req, res) {
  var username = req.headers['x-username'];
  if (!username) res.die('You must supply a username via the "x-username" header');

  req.readData(function(err, data) {
    if (err) return res.die(err);
    if (!Array.isArray(data)) return res.die('/repress only accepts an array of strings');

    db.Select('users')
    .whereEqual({username: username})
    .execute(function(err, rows) {
      if (err) return res.die(err);

      if (rows.length === 0) {
        logger.info('no user could be found with the username "%s"; creating one and bailing out', username);
        createUser(username, function(err) {
          if (err) logger.error('Error creating user; %s', err.toString());
        });

        var dummy_repressions = data.map(function(datum) {
          // just show them all:
          return false;
        });
        res.json(dummy_repressions);
      }
      else {
        var user = rows[0];

        var posts = []; // just the repressed ones
        var repressions = data.map(function(datum) {
          // returns a list of booleans: whether to show the given post
          var author = String(datum.author);
          var content = String(datum.content);

          var matches = liwc.matches(content);
          var match = matches[user.repress];
          // logger.debug('%s in "%s" ? %s (%s)', payload.user.repress, content, !!match, match ? match[0] : null);

          // might as well keep all the posts
          posts.push({
            user_id: user.id,
            author: author,
            content: content,
            repressed: match ? match[0] : null,
          });

          return !!match;
        });
        res.json(repressions);

        // to do: this with a single INSERT () VALUES (), (), (), ...; command
        var started = Date.now();
        async.each(posts, function(post, callback) {
          db.Insert('posts').set(post).execute(callback);
        }, function(err) {
          if (err) logger.error(err);
          logger.debug('inserted posts N=%d [%dms] (pid=%d)', posts.length, Date.now() - started, process.pid);
        });
      }
    });
    // payload is an object: {data: ..., user: Object}
  });
});

/** Returns posts and details for the user matching the current access_token. */
R.get(/^\/repression\/results.json$/, function(req, res) {
  var access_token = req.cookies.get('access_token');

  db.Select('users')
  .whereEqual({access_token: access_token})
  .where('access_token IS NOT NULL')
  .limit(1)
  .execute(function(err, rows) {
    if (err) return res.die('User access error: ' + err.toString());

    var user = rows[0];
    if (!user) return res.status(404).die('User not found');

    var query = db.Select('posts').whereEqual({user_id: user.id});
    async.auto({
      count: function(callback) {
        query.add('COUNT(id)').execute(callback);
      },
      posts: function(callback) {
        query.orderBy('created DESC').limit(500).execute(callback);
      },
    }, function(err, payload) {
      if (err) return res.die(err);
      res.json({
        user: user,
        count: payload.count[0].count,
        posts: payload.posts,
      });
    });
  });
});
R.post(/^\/repression\/survey.json$/, function(req, res) {
  var access_token = req.cookies.get('access_token');

  req.readData(function(err, data) {
    if (err) return res.die('Error parsing request: ' + err.toString());
    db.Insert('surveys')
    .set({
      access_token: access_token,
      repress: data.repress,
    })
    .execute(function(err, rows) {
      if (err) return res.die('Error inserting response: ' + err.toString());

      return res.text('Survey saved');
    });
  });
});


// the admin controller handles its own auth
R.any(/^\/repression\/admin/, require('./admin'));

module.exports = R.route.bind(R);
