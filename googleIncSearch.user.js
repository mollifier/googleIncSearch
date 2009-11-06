// ==UserScript==
// @name GoogleIncSearch
// @namespace http://d.hatena.ne.jp/mollifier/
// @description  Search incrementally in Google
// @include http://www.google.co.jp/search?*
// @include http://www.google.com/search?*
// ==/UserScript==

(function() {

  // ユーティリティ関数
  var Utils = {
    createHTMLDocument : function(source) {
      var XHTML_NS = 'http://www.w3.org/1999/xhtml';
      var doctype = document.implementation.createDocumentType('html',
        '-//W3C//DTD HTML 4.01//EN', 'http://www.w3.org/TR/html4/strict.dtd');
      var doc = document.implementation.createDocument(XHTML_NS, 'html', doctype);
      var range = document.createRange();
      range.selectNodeContents(document.documentElement);
      var content = doc.adoptNode(range.createContextualFragment(source));
      doc.documentElement.appendChild(content);
      return doc;
    },

    trim : function(text) {
      return text.replace(/^\s+/, "").replace(/\s+$/, "");
    },

    Cache : function() {
      this.data = {};
    }

  };

  Utils.Cache.prototype.get = function(key) {
    var ret = null;
    if (this.data.hasOwnProperty(key)) {
      ret = this.data[key];
    }
    return ret;
  };

  Utils.Cache.prototype.set = function(key, value) {
    this.data[key] = value;
  };

  // 設定値
  var Config = {
    // 入力値の変化をチェックする時間(msec)
    // キー入力を開始してからこの間だけ
    // 値が変わったかどうかを周期的にチェックする
    valueChangeCheckTime : 4000,

    // テキストボックスの入力値の変化をチェックする間隔(msec)
    checkInterval : 100
  };

  var box = document.getElementsByName("q")[0];
  var container = document.getElementById("res");
  var oldQuery = Utils.trim(box.value);

  var startInc = function() {
    var requestCount = 0;

    var inc = function() {
      var currentQuery = Utils.trim(box.value);

      if (currentQuery === "") {
        return;
      }

      if (currentQuery === oldQuery) {
        return;
      }

      var addItem = cache.get(currentQuery);

      if (! addItem) {
        var url = "http://www.google.co.jp/search?q=" + currentQuery;

        (function() {
          requestCount++;
          console.log("GM_xmlhttpRequest");
          GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function(res) {
              requestCount--;

              var doc =  Utils.createHTMLDocument(res.responseText);
              responseItem = doc.getElementById("res");
              cache.set(currentQuery, responseItem);

              var item, newItem;
              if (requestCount <= 0) {
                // 結果待ちリクエストがない場合
                item = responseItem;
              } else {
                item = document.createElement("p");
                item.innerHTML = "loading ...";
                item.id = "res";
              }
              newItem = document.importNode(item, true);
              container.parentNode.replaceChild(newItem, container);
              container = newItem;
            }
          });
        })();

      } else {
        container.parentNode.replaceChild(addItem, container);
        container = addItem;
      }

      oldQuery = currentQuery;

    };

    box.removeEventListener("keyup", startInc, false);
    var intervalId = window.setInterval(inc, Config.checkInterval);

    window.setTimeout(function() {
      window.clearTimeout(intervalId);
      box.addEventListener("keyup", startInc, false);
    }, Config.valueChangeCheckTime);

  };

  var cache = new Utils.Cache();

  box.addEventListener("keyup", startInc, false);
})();

