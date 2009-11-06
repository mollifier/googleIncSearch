// ==UserScript==
// @name GoogleIncSearch
// @namespace http://d.hatena.ne.jp/mollifier/
// @description  Search incrementally in Google
// @include http://www.google.co.jp/search?*
// @include http://www.google.com/search?*
// ==/UserScript==

(function() {

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


  var box = document.getElementsByName("q")[0];
  var container = document.getElementById("res");
  var oldQuery = box.value.replace(/^\s+/, "").replace(/\s+$/, "");

  var startInc = function() {
    var requestCount = 0;

    var inc = function() {
      var currentQuery = box.value.replace(/^\s+/, "").replace(/\s+$/, "");

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
    var intervalId = window.setInterval(inc, 100);

    window.setTimeout(function() {
      window.clearTimeout(intervalId);
      box.addEventListener("keyup", startInc, false);
    }, 4000);

  };

  var cache = new Utils.Cache();

  box.addEventListener("keyup", startInc, false);
})();

