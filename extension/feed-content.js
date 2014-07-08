/*jslint browser: true */
// Chrome ID: hmfpcpkjkhfegmageccfkekcdbfdffdn

var log = console.log.bind(console);
// var log = function() {};

var repression_origin = 'https://www.computationalx.com';
document.addEventListener('DOMContentLoaded', function(event) {
  // document.readyState == 'interactive'

  // get username from nav bar
  var timeline_anchor = document.querySelector('.navLink[title=Timeline]');
  window.username = timeline_anchor.pathname.slice(1); // slice off the slash
  log('feed-content: username = %s', window.username);

  // add iframe
  var iframe = document.createElement('iframe');
  var search = '?username=' + window.username;
  iframe.src = repression_origin + '/repression/interface.html' + search;
  iframe.id = 'repression_frame';
  document.body.appendChild(iframe);
  window.repression_frame = iframe;

  // just to make sure set up a timeout
  var initializeMutationObserver_timeout = setTimeout(initializeMutationObserver, 500);
  // get mutation observation target
  window.repression_frame.addEventListener('load', function() {
    clearTimeout(initializeMutationObserver_timeout);
    initializeMutationObserver();
  }, true);
  // and kick it off here, also just to make sure
  setTimeout(repressNewUserContent, 500);
  // also, make sure that they never spend too long waiting for content
  setInterval(ensureEndlessFeed, 500);
});

var initializeMutationObserver = function() {
  log('feed-content: initializing mutation_observer');
  var target = document.getElementById('contentArea');
  window.mutation_observer = new MutationObserver(function(mutations, observer) {
    window.requestAnimationFrame(repressNewUserContent);
  }).observe(target, {
    childList: true,
    subtree: true,
  });
 };

var showElementById = function(element_id) {
  var el = document.getElementById(element_id);
  if (el) {
    el.style.display = 'block';
  }
};

window.addEventListener('message', function(ev) {
  // the messages that the userscript will receive are simple: just IDs of elements to reveal.
  log('feed-content: message', ev.data, 'from', ev.origin);
  if (ev.origin == repression_origin) {
    showElementById(ev.data);
  }
}, false);

var repressNewUserContent = function() {
  var posts = []; // array of {id: '_0_someElementId', content: 'Look, a kitten!'} objects

  // .mbm denotes the container level
  var post_containers = document.querySelectorAll('._5pcb .mbm:not(.processed)');
  if (post_containers.length) {
    log('feed-content: evaluating %d new posts', post_containers.length);
    for (var i = 0, post_container; (post_container = post_containers[i]); i++) {
      // mark the post as processed
      post_container.classList.add('processed');

      // find the actual text content of the post
      var content_el = post_container.querySelector('.userContent');
      var content = content_el ? content_el.textContent : '';
      if (content) {
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
      // setTimeout(function()
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
    // oddly, the more_stories button can get set to have a top of 0
    if (more_stories_top > 1 && more_stories_top < window.innerHeight) {
      log('feed-content: requesting more stories (%d < %d)', more_stories_top, window.innerHeight);
      more_stories.dispatchEvent(new MouseEvent('click'));
    }
  }
};
