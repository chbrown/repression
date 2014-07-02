/*jslint browser: true */
// Chrome ID: ekbecjpljlheelnfeldblankfmapljie

var repression_origin = 'https://www.computationalx.com';
document.addEventListener('DOMContentLoaded', function(event) {
  // document.readyState == 'interactive'

  // get username from nav bar
  var timeline_anchor = document.querySelector('.navLink[title=Timeline]');
  window.username = timeline_anchor.pathname.slice(1); // slice off the slash
  console.log('username = %s', window.username);

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
    console.log('iframe ready; watching for changes:', target);
    new MutationObserver(function(mutations, observer) {
      window.requestAnimationFrame(repressNewUserContent);
    }).observe(target, {
      childList: true,
      subtree: true,
    });
  }, true);

});

window.addEventListener('message', function(ev) {
  // the messages that the userscript will receive are simple: just IDs of elements to reveal.
  // console.log('received message from "%s"', ev.origin);
  if (ev.origin == repression_origin) {
    // console.log('revealing element with id = "%s"', ev.data, ev);
    var post_container = document.getElementById(ev.data);
    if (post_container) {
      post_container.style.display = 'block';
    }
  }
}, false);

var repressNewUserContent = function() {
  var posts = []; // array of {id: '_0_someElementId', text: 'Look, a kitten!'}

  // .mbm denotes the container level
  var post_containers = document.querySelectorAll('._5pcb .mbm:not(.repressed)');

  for (var i = 0, post_container; (post_container = post_containers[i]); i++) {
    // mark the post as processed
    post_container.classList.add('repressed');

    // find the actual text content of the post
    var content_el = post_container.querySelector('.userContent');
    // TODO: don't even send off empty posts
    var content = content_el ? content_el.textContent : '';

    var author_el = post_container.querySelector('.fwb'); // .profileLink doesn't always catch it
    var author = author_el ? author_el.textContent : '';

    posts.push({id: post_container.id, content: content, author: author});
  }

  // we have to wait a second or the iframe will pretend to have
  // http://facebook.com as the origin for some reason, even 100
  // or 200 ms waits are too early
  if (posts.length) {
    window.repression_frame.contentWindow.postMessage(posts, repression_origin);
  }
};
