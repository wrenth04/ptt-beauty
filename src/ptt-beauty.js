(function () {
var ptt = {
  config: {
    folderName: 'ptt-beauty',
    size: '450px',
    pushFilter: 50,
    folderId: null
  },
  init: init,
  route: {
    index: index,
    post: post
  },
  utils: {
    saveToGoogle: saveToGoogle
  }
};

if(typeof unsafeWindow === 'object') { // for greasemonkey
  if(typeof unsafeWindow.ptt === 'object') return;
  unsafeWindow.ptt = ptt;
  unsafeWindow.loginCallback = googleLoginCallback;
} else {
  if(typeof window.ptt === 'object') return;
  window.ptt = ptt;
  window.loginCallback = googleLoginCallback;
}

setTimeout(ptt.init, 100);

function saveToGoogle(_btn) {
  if(!ptt.config.folderId) {
    alert('please login google account');
    return;
  }

  var $post = $(_btn.parentNode);
  var $btn = $(_btn);
  var total = $post.find('.group').length;
  var $progress = $post.find('.progress:first');
  var $status = $post.find('.status:first');
  $btn.hide();
  $progress
    .attr('max', total)
    .val(0)
    .fadeIn();
  $status.text(' 0 / '+total);
  async.eachLimit($post.find('.group'), 5, upload($progress, $status, total), error($btn, $progress, $status));

  function error($btn, $progress, $status) {
    return function (err) { if(err) {
      ptt.config.folderId = null;
      $btn.show();
      $progress.hide();
      $status.text('');
      gapi.auth.signOut();
      $('#signinButton').show();
      alert('please relogin google account');
    }
  }}
  function upload($progress, $status, total) {
    var current = 0;
    return function (_link, next) {
      getBase64Img(_link.href, function(data) {
        var boundary = '-------314159265358979323846';
        var delimiter = "\r\n--" + boundary + "\r\n";
        var close_delim = "\r\n--" + boundary + "--";
        var fileType = 'image/jpg';
        var metadata = {
          'parents': [{id: ptt.config.folderId}],
          'title': _link.title,
          'mimeType': fileType
        };
    
        var multipartRequestBody =
          delimiter
          + 'Content-Type: application/json\r\n\r\n'
          + JSON.stringify(metadata)
          + delimiter
          + 'Content-Type: ' + fileType+ '\r\n'
          + 'Content-Transfer-Encoding: base64\r\n'
          + '\r\n'
          + data
          + close_delim;
    
        var request = gapi.client.request({
          'path': '/upload/drive/v2/files',
          'method': 'POST',
          'params': {'uploadType': 'multipart'},
          'headers': {
            'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
          },
          'body': multipartRequestBody
        });
    
        request.execute(function(res){
          $progress.val(++current);
          $status.text(' ' + current + ' / ' + total);
          if(typeof res.id === 'undefined') return next(new Error({message: 'upload fail'}));
          next();
        });
      });
    }
  }
  
  // cb(base64Data)
  function getBase64Img(url, cb) {
    var img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
    img.onload = function () {
      var canvas = document.createElement("canvas");
      canvas.width =this.width;
      canvas.height =this.height;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(this, 0, 0);
      var dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      cb(dataUrl.replace(/^data:image\/(png|jpeg);base64,/, ""));
    }
  }
}

function googleLoginCallback(authResult) {
  if(authResult['access_token']) {
    document.getElementById('signinButton').setAttribute('style', 'display: none');
    gapi.client.load('drive', 'v2', function(){
      getFolder(function(folder){
        ptt.config.folderId = folder.id;
        var _driveLink = document.getElementById('driveLink');
        _driveLink.style.display = 'block';
        _driveLink.href = 'https://drive.google.com/drive/folders/' + folder.id;
      });
    });
  } else if (authResult['error']) {
    console.log('error')
  }
  
  function getFolder(cb) {
    gapi.client.drive.files.list({q: 'title="'+ptt.config.folderName+'" and trashed=false'}).execute(function(res){
      if(res.items.length == 0) return createFolder(cb);
      return cb(res.items[0]);
    });
  }

  function createFolder(cb) {
    gapi.client.drive.files.insert({
      resource: {
        title: ptt.config.folderName,
        mimeType: 'application/vnd.google-apps.folder'
      }
    }).execute(cb);
  }
}

function init(){
  googleLogin();
  loadLibs();
  var waitLibs = setInterval(function() {
    if(typeof async === 'undefined') return;
    if(typeof jQuery === 'undefined') return;
    if(typeof jQuery.fn.fancybox === 'undefined') return;
    if(typeof jQuery.fn.infinitescroll === 'undefined') return;
    if(typeof jQuery.fn.lazyload === 'undefined') return;
    if(typeof jQuery.url === 'undefined') return;

    clearInterval(waitLibs);
    route();
  }, 100);

  function googleLogin() {
    var _topbar = document.getElementById('topbar');
    _topbar.innerHTML +=
      '<span id="signinButton">'
      +'  <span'
      +'    class="g-signin"'
      +'    data-callback="loginCallback"'
      +'    data-clientid="1029231814918-l22c0cqkah8cfgj34o7pf7g545rr3bbr.apps.googleusercontent.com"'
      +'    data-cookiepolicy="single_host_origin"'
      +'    data-scope="https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/drive">'
      +' </span>'
      +'</span>'
      +'<a id="driveLink" class="google-drive" target="_blank" title="go to drive" style="display: none;"></a>'
      +'<a></a>';
    var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
    po.src = 'https://apis.google.com/js/client:plusone.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
  }
  
  function initPush() {
    ptt.config.pushFilter = parseInt($.url().param('push')) || 0;
    $('.btn-group-paging a:nth-child(4)')[0].href += '?push=' + ptt.config.pushFilter;
    $('.action-bar .btn-group-paging').append(
      '<select id="push">'
      +'<option value="0">0</option>'
      +'<option value="10">10</option>'
      +'<option value="20">20</option>'
      +'<option value="30">30</option>'
      +'<option value="40">40</option>'
      +'<option value="50">50</option>'
      +'<option value="60">60</option>'
      +'<option value="70">70</option>'
      +'<option value="80">80</option>'
      +'<option value="90">90</option>'
      +'<option value="100">爆</option>'
      +'</select>'
    );
    $('#push').val(ptt.config.pushFilter).change(function(){
      if(ptt.config.pushFilter != $(this).val())
        document.location.href = document.location.href.replace(/\?.*/, '') + '?push=' + $(this).val();
    });
  }
  
  function route() {
    var url = document.location.href;
    if(url.indexOf('index') != -1) {
      initPush();
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
      'https://cdnjs.cloudflare.com/ajax/libs/jquery-url-parser/2.3.1/purl.min.js',
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
      +' .btn-group-paging { float: none;}'
      +' .r-ent { width: 95%; margin-left: 2.5%; background-color: #333; border-radius: 10px;}'
      +' .r-ent:hover { background-color: #444;}'
      +' .r-ent .pull-right { margin-right: 10px;}'
      +' .hide { display: none}'
      +' .bbs-screen img { padding: 10px; border-radius: 10px; background-color: white; margin: 5px;}'
      +' .ptt-img { max-width: '+ptt.config.size+'; max-height: '+ptt.config.size+';}'
      +' .google-drive { height: 30px; width: 30px; background-image: url("https://raw.githubusercontent.com/wrenth04/ptt-beauty/master/src/googleDriveIcon.png"); background-repeat: no-repeat; cursor: pointer;}'
    document.head.appendChild(_customCss);
  }
}

function index(){
  $('.bbs-screen').css('max-width', '100%');
  var nextPage = $('.btn-group-paging a:nth-child(2)')
    .attr('href')
    .replace(/.*index/, '')
    .replace('.html', '');
  var pagePrefix = $('.btn-group-paging a:nth-child(2)')
    .attr('href')
    .replace(/[0-9]+\.html/, '');
  var $content = $('.bbs-screen:first');
  var getPhoto = _getPhoto($content);
    
  nextPage = parseInt(nextPage);
  getPhoto($('.r-ent').get());

  $('.bbs-screen').infinitescroll({
    navSelector: '#topbar a:last',
    nextSelector: '.btn-group-paging a:nth-child(2)',
    itemSelector: '.r-ent',
    extraScrollPx: 500,
    path: function(a, b) {
      var prev = pagePrefix + nextPage-- + '.html';
      $('.btn-group-paging a:nth-child(2)').attr('href', prev+'?push='+ptt.config.pushFilter);
      return prev;
    }
  }, getPhoto);
  $('.bbs-screen').infinitescroll('scroll');

  function _getPhoto($content) {
    return function(_posts) {
      var $posts = $(_posts.reverse());
      $posts.remove();
      $content.append($posts);
      $posts.find('.title a').fancybox({
        type: 'iframe',
        padding: 0,
        width: Math.min($('.bbs-screen').width()*0.8, 1200)
      });
  
      var onload = function(req, $title, next) {
        return function() {
          if(req.status != 200) return next();
          
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
              + ' title="'+ $title.text().replace(/\s+/g, ' ') +' ( '+(i+1)+' / '+$imgs.length+' ) "'
              + ' rel="all">'
              + '<img class="ptt-img" data-original="'+ thumb + '"'
              + ' src="https://raw.githubusercontent.com/wrenth04/ptt-beauty/master/src/loading.gif"'
              + '></a>';
          }
          
          var time = $temp.find('.article-meta-value:last').text();
          $title.html(
            $title.html()
            +' ('+ $imgs.length +'p)'
            +' <span class="pull-right">'+time+'</span>'
            + ($imgs.length ? '<i class="google-drive pull-right" title="save to google" onclick="ptt.utils.saveToGoogle(this)"></i>'
                +'<progress class="pull-right progress hide"></progress>'
                +'<span class="pull-right status"></span>': '')
            + '<br>'
            + imgHTML
          );
          var $video = $temp.find('iframe');
          $temp = null;
          $title.append($video)
            .find('a.group img').lazyload({
              effect: 'fadeIn',
              threshold : 300
            });
  
          setTimeout(next, 200);
        };
      };
      
      var found = false;
      var done = function($posts) {
        return function() {
          $posts.find('a.group').fancybox();
          if($('.bbs-screen').height() < 2000 || !found)
            $('.bbs-screen').infinitescroll('scroll');
        };
      };
      
      async.eachLimit($posts.find('.title'), 3, function(title, next) {
        var $title = $(title);
        var $post = $title.parent();
        var pushNum = $post.find('.nrec').text();
  
        if($title.find('a').length == 0 || !(pushNum > ptt.config.pushFilter || pushNum === '爆')) {
          if($('.r-ent') > 1) $post.remove();
          else $post.hide();
          return next();
        }
        
        found = true;
        var req = new XMLHttpRequest();
        req.open('GET', $title.find('a').attr('href'), true);
        req.onload = onload(req, $title, next);
        req.send();
  
      }, done($posts));
    }
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
