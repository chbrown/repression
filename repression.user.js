// ==UserScript==
// @name        Facebook Repression
// @namespace   com.computationalx.repression
// @description Represses your news feed items
// @match       https://*.facebook.com/*
// @match       http://*.facebook.com/*
// @version     0.0.3
// ==/UserScript==

/*jslint browser: true */ /* globals unsafeWindow */
var config = CONFIG_JSON;
// config will look something like {"id":1,"email":"io@henrian.com","repress":"negemo","expires":"2014-07-11T21:39:17.863Z","created":"2014-06-29T21:49:49.810Z"};

var create_iframe = function(iframe_id, iframe_url) {
  // var iframe = document.getElementById(iframe_id);
  var iframe = document.createElement('iframe');
  iframe.id = iframe_id;
  iframe.setAttribute('src', iframe_url);
  document.body.appendChild(iframe);
  return iframe;
};

var find = function(selector) {
  var nodeList = document.querySelectorAll(selector);
  return Array.prototype.slice.apply(nodeList);
};

var nearestAncestor = function(el, className) {
  do {
    el = el.parentNode;
    if (el.classList.contains(className)) {
      return el;
    }
  } while (el.parentNode);
  return null;
};

var iframe_id = 'computationalx_interface';
var search = '?user_id=' + config.id + '&repress=' + config.repress;
var iframe_url = 'https://computationalx.com/repression/interface.html' + search;
var iframe = create_iframe(iframe_id, iframe_url);
window.iframe = iframe;

window.refresh = function() {
  var posts = []; // array of {id: '_0_someElementId', text: 'Look, a kitten!'}

  var userContents = document.querySelectorAll('.userContent');
  for (var i = 0, userContent; (userContent = userContents[i]); i++) {
    var text = userContent.textContent;
    if (text) {
      var container = nearestAncestor(userContent, 'mbm');
      container.style.visibility = 'hidden';
      // console.log('container=%s, text=%s', container.id, 'it', userContent.innerText, 'tc', userContent.textContent, 'ih', userContent.innerHTML);
      posts.push({id: container.id, text: text});
    }
  }

  // we have to wait a second or the iframe will pretend to have http://facebook.com as the origin
  // for some reason, even 100 or 200 ms waits are too early
  if (posts.length) {
    setTimeout(function() {
      console.log('sending message to child', posts);
      iframe.contentWindow.postMessage(posts, 'https://computationalx.com');
    }, 500);
  }
};
refresh();

// the messages that the userscript will receive are simple: just IDs.
window.addEventListener('message', function(ev) {
  console.log('userscript got message', ev);
  if (ev.origin == 'https://computationalx.com') {
    document.getElementById(ev.data).style.visibility = 'visible';
  }
}, false);

// iframe.contentWindow.postMessage([{id: 89, text: 'hate that'}, {id: 100, text: 'love those'}], 'https://computationalx.com');


// var user_contents = find('.userContent');
// (function loop() {
//   if (user_contents.length) {
//     var next = user_contents.shift();
//     var next_ancestor = nearestAncestor(next, 'mbm');
//     console.log('removing upwards of', next, '<', next_ancestor);

//     next_ancestor.style.border = '10px solid black';
//     // next_ancestor.parentNode.removeChild(next_ancestor);

//     // next.innerText
//     // window.next = next;
//     // window.next_ancestor = next_ancestor;
//     setTimeout(loop, 500);
//   }
// })();

// var script = document.createElement('script');
// script.setAttribute('src', '127.0.0.1:80');
// document.head.appendChild(script);
