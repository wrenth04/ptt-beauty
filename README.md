# ptt-beauty-js
user script for web ptt

## Features
* auto load image
* auto load next page
* save image to google [drive](https://drive.google.com/drive/my-drive?ltmpl=drive), [photos](https://plus.google.com/photos/yourphotos)

## Install User Script
1. Firefox install [Greasemonkey](https://addons.mozilla.org/zh-tw/firefox/addon/greasemonkey/)
2. Chrome install [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
3. [One-Click Install](https://github.com/wrenth04/ptt-beauty/raw/master/ptt_beauty.user.js) user script
4. [open web ptt](https://www.ptt.cc/bbs/beauty/index.html)

## Bookmarklet
```javascript
javascript:(function(){document.body.appendChild(document.createElement('script')).src='https://rawgithub.com/wrenth04/ptt-beauty/master/src/ptt-beauty.js?'+new Date().getTime();})();
```


