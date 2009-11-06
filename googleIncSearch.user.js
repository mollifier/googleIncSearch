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

  // 現在の検索状態
  var searchState = function(initialQuery) {
    var requestCount = 0;
    var currentQuery = Utils.trim(initialQuery);
    var oldQuery = "";

    return {
      getCurrentQuery : function() {
        return currentQuery;
      },

      // @return : 設定値が変更された場合 true
      //           そうでない場合 false
      setCurrentQuery : function(q) {
        var ret = false;
        var query = Utils.trim(q);

        if (query !== "" && query !== currentQuery) {
          oldQuery = currentQuery;
          currentQuery = query;

          ret = true;
        }

        return ret;
      },

      startSearching : function() {
        requestCount++;
      },
      stopSearching : function() {
        if (requestCount > 0) {
          requestCount--;
        }
      },
      isSearching : function() {
        return requestCount > 0;
      }
    };
  };

  var box = document.getElementsByName("q")[0];
  var container = document.getElementById("res");

  var initIncSearch = function() {
    var state = searchState(box.value);

    var doIncSearch = function() {
      var queryChanged = state.setCurrentQuery(box.value);

      if (! queryChanged) {
        return;
      }

      var addItem = cache.get(state.getCurrentQuery);

      if (! addItem) {
        var url = "http://www.google.co.jp/search?q=" + state.getCurrentQuery;

        (function(query) {
          state.startSearching();
          console.log("send request : url = %s", url);
          GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            onload: function(res) {
              state.stopSearching();

              var doc =  Utils.createHTMLDocument(res.responseText);
              responseItem = doc.getElementById("res");
              cache.set(query, responseItem);

              var item, newItem;
              if (state.isSearching()) {
                // 別のリクエストを送信して結果待ちである場合
                item = document.createElement("p");
                item.innerHTML = "loading ...";
                item.id = "res";
              } else {
                // 結果待ちリクエストがない場合
                item = responseItem;
              }

              newItem = document.importNode(item, true);
              container.parentNode.replaceChild(newItem, container);
              container = newItem;
            }
          });
        })(state.getCurrentQuery);

      } else {
        // キャッシュにデータがある場合
        container.parentNode.replaceChild(addItem, container);
        container = addItem;
      }
    };

    box.removeEventListener("keyup", initIncSearch, false);
    var intervalId = window.setInterval(doIncSearch, Config.checkInterval);

    window.setTimeout(function() {
      window.clearTimeout(intervalId);
      box.addEventListener("keyup", initIncSearch, false);
    }, Config.valueChangeCheckTime);

  };

  var cache = new Utils.Cache();

  box.addEventListener("keyup", initIncSearch, false);
})();

