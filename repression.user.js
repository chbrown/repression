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


// the messages that the userscript will receive are simple: just IDs of elements to reveal.
window.addEventListener('message', function(ev) {
  console.log('userscript got message', ev);
  if (ev.origin == 'https://www.computationalx.com') {
    document.getElementById(ev.data).style.visibility = 'visible';
  }
}, false);

var initialize = function() {
  var iframe = document.createElement('iframe');
  iframe.setAttribute('src', 'https://www.computationalx.com/repression/interface.html?user_id=' + config.id + '&repress=' + config.repress);
  iframe.id = 'repression_frame';
  document.body.appendChild(iframe);
  return iframe;
};
window.repression_frame = initialize();

var repressNewUserContent = function() {
  var posts = []; // array of {id: '_0_someElementId', text: 'Look, a kitten!'}

  // var userContents = document.querySelectorAll('.userContent');
  var userContents = document.getElementsByClassName('userContent');

  for (var i = 0, userContent; (userContent = userContents[i]); i++) {
    var text = userContent.textContent;
    userContent.classList.remove('userContent');
    if (text) {
      var container = nearestAncestor(userContent, 'mbm');
      container.style.visibility = 'hidden';
      // console.log('container', container.id, 'ih', userContent.innerHTML);
      posts.push({id: container.id, text: text});
    }
  }

  // we have to wait a second or the iframe will pretend to have
  // http://facebook.com as the origin for some reason, even 100
  // or 200 ms waits are too early
  if (posts.length) {
    setTimeout(function() {
      console.log('sending message to child', posts);
      window.repression_frame.contentWindow.postMessage(posts, 'https://www.computationalx.com');
    }, 500);
  }
};

// console.log('repression userscript once', window.location.toString());

var repeatUntilTrue = function(callback) {
  (function loop() {
    if (!callback()) {
      window.requestAnimationFrame(loop);
    }
  })();
};
var initializeMutationObserver = function() {
  var target = document.getElementById('contentArea');
  console.log('initializeMutationObserver', target);
  if (target) {
    new MutationObserver(function(mutations, observer) {
      window.requestAnimationFrame(repressNewUserContent);
    }).observe(target, {
      childList: true,
      subtree: true,
    });
    return true;
  }
  else {
    return false;
  }
};
repeatUntilTrue(initializeMutationObserver);

// var test = [{id: 89, text: 'hate that'}, {id: 100, text: 'love those'}];
// iframe.contentWindow.postMessage(test, 'https://www.computationalx.com');


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
