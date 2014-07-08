# repression

**Install from github:**

    git clone https://github.com/chbrown/repression.git
    cd repression
    npm install
    npm start

Or in cluster mode:

    node cluster.js


### References:

* http://www.chromium.org/developers/design-documents/user-scripts
* https://developer.chrome.com/webstore/faq
* https://developer.chrome.com/webstore/inline_installation
* https://developer.chrome.com/extensions/content_scripts
* https://developer.chrome.com/extensions/declare_permissions
* https://developer.chrome.com/extensions/manifest
* https://chrome.google.com/webstore/developer/dashboard


## Facebook CSS

Facebook obfuscates their CSS, but they don't try too hard, and it's not impossible to figure out.
The notation below uses CSS selector syntax.

* `.mbm` is the going rate for the highest ancestor that contains exactly one individual feed post.
* There can be multiple `._5pcb` divs, which contain multiple `.mbm` divs
* `#substream_0` is the container of `.mbm`'s at page-load, but new feed posts are not added inside it.
* We watch for changes to `#contentArea`, which contains a lot of the page, but all we want with that watcher is a single common ancestor of all potential `._5pcb`'s.
* `.userContent` is the container of original text within a feed post. It may not exist, or it may be totally empty; e.g., for photos.
* `.navLink[title=Timeline]` will get the link to the user's personal profile page, which is how we capture their username.
* `.fwb` contains the feed post's author's name. In some cases it contains the target, too, but it's hard to pull them apart further than this.


## License

Copyright © 2014 Christopher Brown. [MIT Licensed](LICENSE).
