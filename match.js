/*jslint node: true */
var liwc_json = require('./liwc');

var compile = function(tokens) {
  var matches = tokens.map(function(token) {
    if (token.match(/\*$/)) {
      return token.replace(/\*$/, '');
    }
    else {
      return token + '\\b';
    }
  });
  console.log('\\b(' + matches.join('|') + ')');
  return new RegExp('\\b(' + matches.join('|') + ')', 'i');
};

var posemo_re = compile(liwc_json.posemo);
var negemo_re = compile(liwc_json.negemo);

var match = exports.match = function(string) {
  /** returns an object */
  var matches = {};
  if (string.match(posemo_re)) matches.posemo = 1;
  if (string.match(negemo_re)) matches.negemo = 1;
  return matches;
};

if (require.main === module) {
  var texts = [
    'He hates me for my awesome smile', // both
    'My laptop is awesome', // posemo
    'I hate my laptop', // negemo
    'My laptop is white', // neither
  ].forEach(function(text) {
    console.log(text, '->', match(text));
  });
}
