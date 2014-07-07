/*jslint browser: true */
// Chrome ID: ekbecjpljlheelnfeldblankfmapljie

var repression_origin = 'https://www.computationalx.com';
document.addEventListener('DOMContentLoaded', function(event) {
  // document.readyState == 'interactive'

  // get username from nav bar
  var timeline_anchor = document.querySelector('.navLink[title=Timeline]');
  window.username = timeline_anchor.pathname.slice(1); // slice off the slash
  // console.log('username = %s', window.username);

  // add iframe
  var iframe = document.createElement('iframe');
  var search = '?username=' + window.username;
  iframe.src = repression_origin + '/repression/interface.html' + search;
  iframe.id = 'repression_frame';
  document.body.appendChild(iframe);
  window.repression_frame = iframe;

  // get mutation observation target
  var target = document.getElementById('contentArea');
  window.repression_frame.addEventListener('load', function() {
    // console.log('iframe ready; watching for changes:', target);
    new MutationObserver(function(mutations, observer) {
      window.requestAnimationFrame(repressNewUserContent);
    }).observe(target, {
      childList: true,
      subtree: true,
    });
  }, true);

});

var showElementById = function(element_id) {
  var el = document.getElementById(element_id);
  if (el) {
    el.style.display = 'block';
  }
};

window.addEventListener('message', function(ev) {
  // the messages that the userscript will receive are simple: just IDs of elements to reveal.
  if (ev.origin == repression_origin) {
    showElementById(ev.data);
  }
}, false);

var repressNewUserContent = function() {
  var posts = []; // array of {id: '_0_someElementId', content: 'Look, a kitten!'} objects

  // .mbm denotes the container level
  var post_containers = document.querySelectorAll('._5pcb .mbm:not(.repressed)');

  for (var i = 0, post_container; (post_container = post_containers[i]); i++) {
    // mark the post as processed
    post_container.classList.add('repressed');

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
    window.repression_frame.contentWindow.postMessage(posts, repression_origin);
  }
};
