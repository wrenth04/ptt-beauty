(function () {
var ptt = {
  config: {
    size: '450px'
  },
  init: init,
  route: {
    index: index,
    post: post
  }
}
if(typeof unsafeWindow === 'object') { // for greasemonkey
  if(typeof unsafeWindow.ptt === 'object') return;
  unsafeWindow.ptt = ptt;
} else {
  if(typeof window.ptt === 'object') return;
  window.ptt = ptt;
}

setTimeout(function(){ ptt.init(); }, 100);

function init(){
  loadLibs();
  var waitLibs = setInterval(function() {
    if(typeof async === 'undefined') return;
    if(typeof jQuery === 'undefined') return;
    if(typeof jQuery.fn.fancybox === 'undefined') return;
    if(typeof jQuery.fn.infinitescroll === 'undefined') return;
    if(typeof jQuery.fn.lazyload === 'undefined') return;

    clearInterval(waitLibs);
    route();
  }, 100);

  function route() {
    var url = document.location.href;
    if(url.indexOf('index') != -1) {
      ptt.route.index();
    } else if(url.replace(/\/M[^\/]+html$/).length != url.length) {
      ptt.route.post();
    }
  }

  function loadLibs() {
    var scripts = [
      'https://cdnjs.cloudflare.com/ajax/libs/fancybox/2.1.5/jquery.fancybox.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jquery-mousewheel/3.1.12/jquery.mousewheel.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/async/0.9.0/async.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jquery-infinitescroll/2.0b2.120519/jquery.infinitescroll.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jquery.lazyload/1.9.1/jquery.lazyload.min.js'
    ];

    var csss = [
      'https://cdnjs.cloudflare.com/ajax/libs/fancybox/2.1.5/jquery.fancybox.css'
    ];

    scripts.forEach(function(s) {
      var _scirpt = document.createElement('script');
      _scirpt.src = s;
      document.head.appendChild(_scirpt);
    });

    csss.forEach(function(s) {
      var _css = document.createElement('link');
      _css.href = s;
      _css.rel = 'stylesheet';
      document.head.appendChild(_css);
    });

    var _customCss = document.createElement('style');
    _customCss.innerHTML =
      'a.fancybox-nav:hover, a.group:hover { background-color:transparent }'
      +' .r-ent { width: 95%; margin-left: 2.5%; background-color: #333; border-radius: 10px;}'
      +' .r-ent:hover { background-color: #444;}'
      +' .r-ent .pull-right { margin-right: 10px;}'
      +' .bbs-screen img { padding: 10px; border-radius: 10px; background-color: white; margin: 5px;}'
      +' .ptt-img { max-width: '+ptt.config.size+'; max-height: '+ptt.config.size+';}'
    document.head.appendChild(_customCss);
  }
}

function index(){
  $('.bbs-screen').css('max-width', '100%');
  var nextPage = $('.pull-right a:nth-child(2)')
    .attr('href')
    .replace(/.*index/, '')
    .replace('.html', '');
  var pagePrefix = $('.pull-right a:nth-child(2)')
    .attr('href')
    .replace(/[0-9]+\.html/, '');
  var $content = $('.r-ent:first').parent();
    
  nextPage = parseInt(nextPage);
  getPhoto($('.r-ent').get());

  $('.bbs-screen').infinitescroll({
    navSelector: '#topbar a:last',
    nextSelector: '.pull-right a:nth-child(2)',
    itemSelector: '.r-ent',
    extraScrollPx: 500,
    path: function(a, b) {
      var prev = pagePrefix + nextPage-- + '.html';
      $('.pull-right a:nth-child(2)').attr('href', prev);
      return prev;
    }
  }, function(_posts, options, pagePath) {
    getPhoto(_posts);
  });
  //$('.bbs-screen').infinitescroll('scroll');

  function getPhoto(_posts) {
    var $posts = $(_posts.reverse());
    $posts.remove();
    $content.append($posts);
    $posts.find('.title a').fancybox({
      type: 'iframe',
      padding: 0,
      width: Math.min($('.bbs-screen').width()*0.8, 1200)
    });

    async.each($posts.find('.title'), function(title, next) {
      var $title = $(title);
      if($title.find('a').length == 0) return next();

      var req = new XMLHttpRequest();
      req.open('GET', $title.find('a').attr('href'), true);
      req.onload = function() {
        if(req.status == 200) {
          var rawHTML = req.responseText.replace(/<img/g, '<imeg').replace(/img>/g, 'imeg>');
          var $temp = $(rawHTML);
          var $imgs = $temp.find('imeg');

          var imgHTML = '';
          for(var i=0 ; i<$imgs.length ; i++) {
            var thumb = $($imgs[i]).attr('src');
            if(thumb.indexOf('imgur.com') != -1) {
              thumb = thumb.replace(/\.[^\.]+$/, 'l.') + thumb.split('.').pop();
            }
            imgHTML+= 
              '<a class="group" href="'+ $($imgs[i]).attr('src') +'"'
              + ' title="'+ $title.text() +' ( '+(i+1)+' / '+$imgs.length+' ) "'
              + ' rel="all">'
              + '<img class="ptt-img" data-original="'+ thumb + '"'
              + ' src="https://raw.githubusercontent.com/wrenth04/ptt-beauty/master/src/loading.gif"'
              + '></a>';
          }
          
          var time = $temp.find('.article-meta-value')[3].innerHTML;
          $title.html(
            $title.html()
            +' ('+ $imgs.length +'p)'
            +' <span class="pull-right">'+time+'</span><br>'
            + imgHTML
          );
          var $video = $temp.find('iframe');
          $title.append($video);
          delete $temp;

          next();
        }
      }
      req.send();

    }, function() {
      $posts.find('a.group').fancybox();
      $posts.find('a.group img').lazyload({
        effect: 'fadeIn',
        threshold : 300
      });
    });
  }
}

function post() {
  var isInIFrame = (window.location != window.parent.location);
  if(isInIFrame) {
    $('#topbar-container').remove();
    $('#navigation-container').remove();
    document.body.style.padding = '0px';
  } else {
    var _imgs = document.getElementsByTagName('img');
    for(var i=0 ; i<_imgs.length ; i++) {
      var _parent = _imgs[i].parentNode;
      _parent.innerHTML =
        '<a class="group" href="'+ _imgs[i].src +'"'
        + ' title="'+(i+1)+' / '+_imgs.length+'"'
        + ' rel="all">'
        + _parent.innerHTML
        + '</a>';
    }
  
    $('a.group').fancybox();
  }
}
}());

