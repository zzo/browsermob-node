NodeJS bindings for browsermob-proxy to programmatically generate HAR files
===========================

1. First see [browsermob-proxy](https://github.com/webmetrics/browsermob-proxy)

2. Then visit [Selenium](http://seleniumhq.org) or [CasperJS](http://casperjs.org)

3. Finally grok [HAR files](http://www.softwareishard.com/blog/har-12-spec/)

OK - now you're on the right track!

Quick Start
-----------

```javascript
var Proxy = require('browsermob-proxy').Proxy
  , proxy = new Proxy()
  , fs = require('fs');

proxy.doHAR('http://yahoo.com', function(err, data) {
    if (err) {
        console.error('ERROR: ' + err);
    } else {
        fs.writeFileSync('yahoo.com.har', data, 'utf8');
    }
});
```

Configuring the Proxy Object
----------------------------

You need to tell the Proxy() constructor where browsermob-proxy is running.  The defaults are running on 'localhost' port 8080:

```javascript

proxy = new Proxy();
```

Starting browsermob-proxy somewhere else?:

```javascript

proxy = new Proxy({ host: 'some.other.host', port: <some other port> });
```

**Optionally Specifying a fixed Proxy Port**

When you create new proxies, browsermob-proxy can automatically choose which port to open them on.

Alternatively, you can specify the port you expect proxes to be created on when you create the proxy object by setting it here:

```javascript

proxy = new Proxy({ proxyPort: <some other port> });
```

*N.B.* You can also specify a port when using the doHAR or cbHAR functions for more fine tuned control

Ports passed to doHAR / cbHAR take override any proxyPort set here. And if no proxy port is set here or passed to those functions, then browsermob-proxy will fall back to automatcially choosing a port and reporting to the user the host:port on which the proxy has been created.

**Optionally Specifying Selenium Host & Port**

IF using Selenium you can specify the host and port. The defaults are 'localhost' port 4444:

```javascript

proxy = new Proxy({ selHost: 'some.other.host', selPort: <some other port> });
```

**Bandwidth Limits**

In the Proxy constructor you can specify bandwidth and latency limitations like so:

```javascript
var proxy = new Proxy( { downloadKbps => 56, uploadKbps => 56, latency 200 } );
```

Would tell the proxy to act like a 56K modem with 200ms latency.


Details
-------

You need to install and start the [browsermob-proxy](https://github.com/webmetrics/browsermob-proxy):

    % /bin/sh bin/browsermob-proxy

You also need to use either Selenium OR CasperJS

Selenium
--------

[Get the latest 'selenium-server-standalone' JAR](http://seleniumhq.org/download/) (currently 2.20.0) and start it where Firefox is available:

    % java -jar selenium-server-standalone-2.20.0.jar

CasperJS
--------

Grab the latest version of [CasperJS](http://casperjs.org)


Convenience API
----------------

**doHAR(URL, CALLBACK)**

Generate HAR data in one-shot - expects Selenium to be running somewhere - if not running on 'localhost' port 4444 you need to tell it otherwise via the Proxy constructor 'selHost' and 'selPort':

```javascript

proxy = new Proxy({ selHost: 'some.other.host', selPort: <some other port> }); // If not at localhost:4444
```

PARAMETERS

    * URL URL is page to get HAR data for
    * CALLBACK(ERROR, HAR) function
        1. ERROR string if there was an error 
        2. HAR string data
    * (optional) PROXY_PORT - port on which proxy will be available (If passed then this port will override any proxyPort set in configuration when creating the proxy)

EXAMPLE:

```javascript

var Proxy = require('browsermob-proxy').Proxy;
    , proxy = new Proxy();

proxy.doHAR('http://yahoo.com', function(err, data) {
    if (err) {
        console.error('ERROR: ' + err);
    } else {
        fs.writeFileSync('yahoo.com.har', data, 'utf8');
    }
});
```

**cbHAR(OPTIONS, GENERATE_TRAFFIC_CALLBACK, HAR_CALLBACK)**

Convenience method to get HAR data - this method allows you to generate whatever traffic you like (via the CALLBACK), and then generate the HAR file.  

PARAMETERS

    * OPTIONS is an object with keys 'proxyPort', 'name', 'captureHeaders', 'captureContent' and 'captureBinaryContent'; 'proxyPort' the port number on which this proxy should be available (If passed then this port will override any proxyPort set in configuration when creating the proxy); 'name' is an abritrary name for this run - like 'yahoo.com' or whatever you like; 'captureHeaders', 'captureContent' and 'captureBinaryContent' expect booleans indicating whether to capture resp headers, body of http transactions, and binary body of transactions. For backwards compatibility reasons, if OPTIONS is a string, it will be interpreted as the name for the run.
    * GENERATE_TRAFFIC_CALLBACK(PROXY, DONE_CALLBACK)

        PARAMETERS

            * PROXY is the proxy you must use which is a string of the form '<hostname>:<port>'.  All traffic you generate that you want to be part of the HAR must use this proxy!  That is the whole point of this thing.
            * DONE_CALLBACK is the function you call when you are done generating traffic and are ready to generate the HAR file.

    * HAR_CALLBACK(ERROR, HAR) function 
        1. ERROR string if there was an error 
        2. HAR string data

EXAMPLE

```javascript

var Proxy = require('browsermob-proxy').Proxy
    , webdriverjs = require("webdriverjs")
    , fs = require('fs')
    , proxy = new Proxy()
;

proxy.cbHAR('search.yahoo.com', doSeleniumStuff, function(err, data) {
        if (err) {
            console.error('ERR: ' + err);
        } else {
            fs.writeFileSync('stuff.har', data, 'utf8');
        }
});

function doSeleniumStuff(proxy, cb) {
    var browser = webdriverjs.remote({
        host: 'localhost'
        , port: 4444
        , desiredCapabilities: { browserName: 'firefox', seleniumProtocol: 'WebDriver', proxy: { httpProxy: proxy } }
    });

    browser
        .init()
        .url("http://search.yahoo.com")
        .setValue("#yschsp", "javascript")
        .submitForm("#sf")
        .end(cb);
}
```

Note you MUST use 'firefox' or 'ie' browser and note how I set the Selenium proxy to go thru browsermob-proxy.  I have both Selenium server standalone and browsermob-proxy running on localhost on their default ports (4444 and 8080 respectively).

CasperJS
--------

Here is an example using CasperJS - no Selenium required! - you pass the path to a CasperJS script to the provided 'bin/runCasper.js' script and all of its interactions will be captured:

    % bin/runCasper.js casperScript.js

The 'runCasper.js' script is part of this package.

Here is a sample CasperJS script:

```javascript

var casper = require('casper').create();

casper.start('http://search.yahoo.com/', function() {
    this.fill('form#sf', { "p": 'javascript' }, false);
    this.click('#yschbt');
});

casper.run(function() {
    this.exit();
});
```

Here is it put all together:

    % node bin/runCasper.js searchYahooCasper.js

This will dump a HAR file named: 'searchYahooCasper.js.har' in the current directory.


Gory Details
------------

You can control the browsermob-proxy directly if you want even finer-grained control using methods mapped directly to its REST interface.  Here is an example:

```javascript

var webdriverjs = require("webdriverjs")
    , Proxy = require('browsermob-proxy').Proxy
    , fs = require('fs')
    , proxyHost = 'localhost'
    ;

    var proxy = new Proxy( { host: proxyHost });
    proxy.start(function(err, data) {
                if (!err) {
                    // SET AND OVERRIDE HTTP REQUEST HEADERS IF YOU WANT TO
                    var headersToSet = {
                        'User-Agent': 'Bananabot/1.0',
                        'custom-header1': 'custom-header1-value',
                        'custom-header2': 'custom-header2-value'
                    }
                    proxy.addHeader(data.port, headersToSet, function (err,resp) {
                        if(!err) {
                            proxy.startHAR(data.port, 'http://localhost:8004', function (err, resp) {
                                if (!err) {
                                    // DO WHATEVER WEB INTERACTION YOU WANT USING THE PROXY
                                    doSeleniumStuff(proxyHost + ':' +  data.port, function () {
                                        proxy.getHAR(data.port, function(err, resp) {
                                            if (!err) {
                                                console.log(resp);
                                                fs.writeFileSync('output.har', resp, 'utf8');
                                            } else {
                                                console.err('Error getting HAR file: ' + err);
                                            }
                                            proxy.stop(data.port, function() {});
                                        });
                                    });
                                } else {
                                    console.error('Error starting HAR: ' + err);
                                    proxy.stop(data.port, function () {
                                    });
                                }
                            });
                        } else {
                             console.error('Error setting the custom headers');
                             proxy.stop(data.port, function () {
                           });
                        }
                    });
                } else {
                    console.error('Error starting proxy: ' + err);
                }
            });


function doSeleniumStuff(proxy, cb) {
    var browser = webdriverjs.remote({
        host: 'localhost'
        , port: 4444
        , desiredCapabilities: { browserName: 'chrome', seleniumProtocol: 'WebDriver', proxy: { httpProxy: proxy } }
    });

    browser
        .testMode()
        .init()
        .url("http://search.yahoo.com")
        .setValue("#yschsp", "javascript")
        .submitForm("#sf")
        .tests.visible('#resultCount', true, 'Got result count')
        .saveScreenshot('results.png')
        .end(cb);
}
```

In this example I am manually controlling the browsermob-proxy - the convenience methods 'doHAR' and 'cbHAR' do most of this stuff for you so use them!

The sequence is

1. create a new proxy object 
2. proxy.start()
3. proxy.startHAR()
4. DO SOMETHING
5. proxy.getHAR()
6. proxy.stop()

Full API
--------

**start([ PORT ], CALLBACK)**

    Initializes a proxy

    PARAMETERS:

        * an optional PORT parameter specifying which port to open up a proxy on - if not provided browsermob will pick one.
        * CALLBACK(ERROR, DATA) function
            1. ERROR string if there was an error
            2. DATA object whose only member is 'port' - the port the proxy is listening on

**startHAR(PORT, [ NAME, CAPTUREHEADERS, CAPTURECONTENT, CAPTUREBINARYCONTENT ], CALLBACK)**

    Instructs the proxy listening on the given port to start generating the HAR - after this call all traffic thru this proxy will become part of the HAR

    PARAMETERS:

        * PORT of proxy for this command
        * Optional NAME for this HAR
        * Optional boolean CAPTUREHEADERS to record HTTP headers
        * Optional boolean CAPTURECONTENT to record content of the requests
        * Optional boolean CAPTUREBINARYCONTENT to record binary content
        * CALLBACK(ERROR) function
            1. ERROR string if there was an error 


**getHAR(PORT, CALLBACK)**

    Gets the current HAR for the proxy on PORT

    PARAMETERS:

        * PORT of proxy for this command
        * CALLBACK(ERROR, HAR) function
            1. ERROR string if there was an error 
            2. HAR string

**stop(PORT, CALLBACK)**
    
    Stops the proxy on PORT

    PARAMETERS:

        * PORT of proxy for this command
        * CALLBACK(ERROR) function
            1. ERROR string if there was an error 

**limit(PORT, LIMIT_OBJ, CALLBACK)**
    
    Sets bandwidth and latency limits for proxy on PORT

    PARAMETERS:

        * PORT of proxy for this command
        * LIMIT_OBJ an object with 3 possible keys: downloadKbps, uploadKbps, and latency.  Any set keys will be set on the specified proxy port
        * CALLBACK(ERROR) function
            1. ERROR string if there was an error 

**newPage(PORT, NAME, CALLBACK)**
    
    Sets a new page name for the HAR listening on PORT

    PARAMETERS:

        * PORT of proxy for this command
        * NAME new name for the HAR report
        * CALLBACK(ERROR) function
            1. ERROR string if there was an error 

**addHeader(PORT, HEADERSTOSET, CALLBACK)**
    
    Set and override HTTP Request headers
    
     PARAMETERS:
    
            * PORT of proxy for this command
            * Headers to set
            * CALLBACK(ERROR) function
                1. ERROR string if there was an error

**remapHosts(PORT, {'example.com': '1.2.3.4'}, CALLBACK)**

    Overrides normal DNS lookups and remaps the given hosts with the associated IP address
    Payload data should be json encoded set of name/value pairs (ex: {'example.com': '1.2.3.4'})

     PARAMETERS:

            * PORT of proxy for this command
            * Hosts to remap
            * CALLBACK(ERROR) function
                1. ERROR string if there was an error
