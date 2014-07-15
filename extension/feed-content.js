/*jslint browser: true */
// Chrome ID: hmfpcpkjkhfegmageccfkekcdbfdffdn

var repression_origin = 'https://www.computationalx.com';
var log = console.log.bind(console);
// var log = function() {};

var showElementById = function(element_id) {
  var el = document.getElementById(element_id);
  if (el) {
    el.style.display = 'block';
  }
};

window.onhashchange = function() {
  log('feed-content: onhashchange');
  initializeIFrame();
  initializeMutationObserver();
};

document.addEventListener('DOMContentLoaded', function() {
  log('feed-content: document:DOMContentLoaded');


  // get username from nav bar
  var timeline_anchor = document.querySelector('.navLink[title=Timeline]');
  window.username = timeline_anchor.pathname.slice(1); // slice off the slash
  // log('feed-content: username = %s', window.username);

  if (!window.endless_feed_interval) {
    // also, make sure that they never spend too long waiting for content
    window.endless_feed_interval = setInterval(ensureEndlessFeed, 500);
  }

  initializeIFrame();
  initializeMutationObserver();
});

var initializeIFrame = function() {
  if (!window.repression_frame) {
    // add iframe
    var iframe = document.createElement('iframe');
    var search = '?username=' + window.username;
    iframe.src = repression_origin + '/repression/interface.html' + search;
    iframe.id = 'repression_frame';
    document.body.appendChild(iframe);
    window.repression_frame = iframe;
    log('feed-content: added iframe');

    window.repression_frame_ready = false;
    window.repression_frame.addEventListener('load', function() {
      log('feed-content: iframe ready');
      window.repression_frame_ready = true;
    });

    // kick it off here, also just to make sure
    setTimeout(repressNewUserContent, 500);
  }
  else {
    log('feed-content: iframe already exists');
  }
};

var initializeMutationObserver = function() {
  if (window.mutation_observer) {
    log('feed-content: disconnecting existing mutation observer');
    window.mutation_observer.disconnect();
  }

  log('feed-content: initializing mutation observer');
  var target = document.getElementById('contentArea');
  window.mutation_observer = new MutationObserver(function(mutations, observer) {
    window.requestAnimationFrame(repressNewUserContent);
  }).observe(target, {
    childList: true,
    subtree: true,
  });
};

window.addEventListener('message', function(ev) {
  // the messages that the userscript will receive are simple: just IDs of elements to reveal.
  log('feed-content: message "%s" from %s', ev.data, ev.origin);
  if (ev.origin == repression_origin) {
    showElementById(ev.data);
  }
}, false);

var repressNewUserContent = function() {
  var posts = []; // array of {id: '_0_someElementId', content: 'Look, a kitten!'} objects

  // ._2l4l denotes the container level
  var post_containers = document.querySelectorAll('._5pcb ._2l4l:not(.processed)');
  if (post_containers.length) {
    log('feed-content: evaluating %d new posts', post_containers.length);
    for (var i = 0, post_container; (post_container = post_containers[i]); i++) {
      // mark the post as processed
      post_container.classList.add('processed');

      // find the actual text content of the post
      var content_el = post_container.querySelector('.userContent');
      var content = content_el ? content_el.textContent : '';
      // just bail out and show the post if the repression_frame is not yet ready
      if (content && window.repression_frame_ready) {
        // only send off non-empty posts
        var author_el = post_container.querySelector('.fwb'); // .profileLink doesn't always catch it
        var author = author_el ? author_el.textContent : '';

        posts.push({id: post_container.id, content: content, author: author});
      }
      else {
        showElementById(post_container.id);
      }
    }

    if (posts.length) {
      window.repression_frame.contentWindow.postMessage(posts, repression_origin);
    }
  }
};

// hack: check that the "More Stories" button is not visible.
// if it is, click it!
var ensureEndlessFeed = function() {
  var more_stories = document.querySelector('._5usd');
  if (more_stories) {
    var more_stories_top = more_stories.getBoundingClientRect().top;
    // oddly, the more_stories button can have a top of 0
    if (more_stories_top > 1 && more_stories_top < window.innerHeight) {
      log('feed-content: requesting more stories (%d < %d)', more_stories_top, window.innerHeight);
      more_stories.dispatchEvent(new MouseEvent('click'));
    }
  }
};
