var page = require('webpage').create();
var system = require('system');
var t;
var address;

var redirects = [];
var css = [];
var js = [];
var js_head;
var js_body;

if (system.args.length === 1) {
    console.log('Usage: loadspeed.js <some URL>');
    phantom.exit(1);
} else {
    t = Date.now();
    address = system.args[1];
    page.open(address, function (status) {
        if (status !== 'success') {
            console.log('FAIL to load the address');
        } else {
            t = Date.now() - t;
            console.log('Page title is ' + page.evaluate(function () {
                return document.title;
            }));

            js_head = page.evaluate(function () {
                var scripts = document.getElementsByTagName("head")[0].getElementsByTagName("script");
                var result = [];
                for (var i=0;i < scripts.length;i++) {
                    result.push({src: scripts[i].src, inner: scripts[i].innerHTML});
                }

                return result;
            });

            js_body = page.evaluate(function () {
                var scripts = document.getElementsByTagName("body")[0].getElementsByTagName("script");
                var result = [];
                for (var i=0;i < scripts.length;i++) {
                    result.push({src: scripts[i].src, inner: scripts[i].innerHTML});
                }

                return result;
            });

            console.log('Loading time: ' + t + ' msec');
            console.log('Redirects: ');
            redirects.forEach(function(object) {
                console.log(object.url + ' => ' + object.redirect);
            });

            console.log('CSS: ');
            css.forEach(function(object) {
                console.log(object.url);
            });

            console.log('Javascript: ');
            js.forEach(function(object) {
                console.log(object.url);
            });

            console.log('Javascript head: ');
            js_head.forEach(function(object) {
                console.log(object.src + ":" + object.inner);
            });

            console.log('Javascript body: ');
            js_body.forEach(function(object) {
                console.log(object.src + ":" + object.inner);
            });
        }
        phantom.exit();
    });
}

page.onConsoleMessage = function(msg, lineNum, sourceId) {
    console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};

page.onResourceRequested = function(requestData, networkRequest) {
    //console.log('Request (#' + requestData.id + '): ' + JSON.stringify(requestData) + JSON.stringify(networkRequest) + "\n");
};

page.onResourceReceived = function(response) {
    if (response.stage != 'end') return;

    //console.log('Response (#' + response.id + ', stage "' + response.stage + '"): ' + JSON.stringify(response) + "\n");
    if (response.status == '301') {
        redirects.push({url: response.url, redirect: response.redirectURL});
    }

    extension = response.url.substr(response.url.length - 3);
    switch(extension) {
        case 'css':
        css.push({url: response.url});
        break;
        case '.js':
        js.push({url: response.url});
        break;
    }
};
