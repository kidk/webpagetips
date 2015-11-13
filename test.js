var page = require('webpage').create();
var system = require('system');


var t;
var address;

var debug = true;

if (system.args.length === 1) {
    console.log('Usage: loadspeed.js <some URL>');
    phantom.exit(1);
} else {
    // Start load timer
    t = Date.now();

    // Get address from arguments
    address = system.args[1];

    // Open page
    page.open(address, function (status) {

        // Check page results
        if (status !== 'success') {
            console.log('FAIL to load the address');
            phantom.exit();
        } else {
            // End of load time
            t = Date.now() - t;

            sleep();
        }

    });
}

var requests = [];

function sleep() {
    setTimeout(function() {
        var finished = true;
        if (debug) console.log('waiting');
        requests.forEach(function(object) {
            if (object.status == 0) {
                if (debug) console.log(JSON.stringify(object));
                if (object.timestart + 10 < Date.now()) {
                    object.status = 408;
                } else {
                    finished = false;
                }
            }
        });

        if (finished) {
            finish();
        } else {
            if (debug) console.log('sleep called');
            sleep();
        }
    }, 500);
}

function finish() {
    // Save all javascript script tags
    js_head = page.evaluate(function () {
        var scripts = document.getElementsByTagName("head")[0].getElementsByTagName("script");
        var result = [];
        for (var i=0;i < scripts.length;i++) {
            result.push({'type': ((scripts[i].src) ? 'external':'inline'), 'src': scripts[i].src || 'inline script #' + i, 'inner': scripts[i].innerHTML, 'location': 'head'});
        }

        return result;
    });

    js_body = page.evaluate(function () {
        var scripts = document.getElementsByTagName("body")[0].getElementsByTagName("script");
        var result = [];
        for (var i=0;i < scripts.length;i++) {
            result.push({'type': ((scripts[i].src) ? 'external':'inline'), 'src': scripts[i].src || 'inline script #' + i, 'inner': scripts[i].innerHTML, 'location': 'body'});
        }

        return result;
    });

    scripts = [];
    js_head.forEach(function(object) {
        scripts.append(object);
    });

    js_body.forEach(function(object) {
        scripts.append(object);
    });

    console.log(JSON.stringify({
        'address': address,
        'timespend': t,
        'requests': requests,
        'scripts': scripts
    }));

    phantom.exit();
}

function setRequestLocation()

page.onConsoleMessage = function(msg, lineNum, sourceId) {
    if (debug) console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
};

page.onResourceRequested = function(requestData, networkRequest) {
    if (debug) console.log('Request (#' + requestData.id + '): ' + JSON.stringify(requestData) + JSON.stringify(networkRequest) + "\n");

    requests[requestData.id] = {
        'id': requestData.id,
        'timestart': Date.now(),
        'timestop': -1,
        'url': requestData.url,
        'headers': {
            'request': requestData.headers,
            'response': undefined
        },
        'status': 0,
        'size': 0
    };
};

page.onResourceReceived = function(response) {
    if (debug) console.log('Response (#' + response.id + ', stage "' + response.stage + '"): ' + JSON.stringify(response) + "\n");

    if (response.stage != 'end') return;

    requests[response.id].timestop = Date.now();
    requests[response.id].headers.response = response.headers
    requests[response.id].status = response.status;
    requests[response.id].size = response.bodySize;
};
