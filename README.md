NodeJS bindings for broswermob-proxy programmable proxy to programmatically generate HAR files
===========================

1. First see [browsermob-proxy](https://github.com/webmetrics/browsermob-proxy)

2. Then visit [Selenium](http://seleniumhq.org) or [CasperJS](http://casperjs.org)

3. Finally grok [HAR files](http://www.softwareishard.com/blog/har-12-spec/)

OK - now you're on the right track!

Quick Start
-----------

Javascript:

    var Proxy = require('browsermode-proxy').Proxy;
        , proxy = new Proxy();

    proxy.doHAR('http://yahoo.com', function(err, data) {
        if (err) {
            console.error('ERROR: ' + err);
        } else {
            fs.writeFileSync('yahoo.com.har', data, 'utf8');
        }
    });

Details
-------

You need to install and start the browsermob-proxy available above:

    % /bin/sh bin/browsermob-proxy &

You also need to use either Selenium OR PhantomJS (and optionally) CasperJS

Selenium
--------

[Get the latest 'selenium-server-standalone' JAR](http://seleniumhq.org/download/) (currently 2.20.0) and start it where Firefox is available:

    % java -jar selenium-server-standalone-2.20.0.jar

CasperJS
--------

Grab the latest version of [CasperJS](http://casperjs.org)

Configure the Proxy Object
---------------------------

You need to tell the Proxy() constructor where browsermob-proxy is running.  The defaults are running on 'localhost' port 8080:

Javascript:

    proxy = new Proxy();

Somewhere else?:

Javascript:

    proxy = new Proxy({ host: 'some.other.host', port: <some other port> });

If you're using Selenium you need to tell the Proxy() constructor where Selenium is running (ONLY IF YOU ARE USING THE 'doHAR'
convenience method) - the defaults are 'localhost' and port 4444.  Somewhere else?:

Javascript:

    proxy = new Proxy({ selHost: 'some.other.host', selPort: <some other port> });

Convenience API
----------------

**doHAR(URL, CALLBACK)**

    Conveience method to get HAR data in one-shot - expects Selenium to be running somewhere - if not running on 'localhost' port 4444 you need to tell it otherwise via the Proxy constructor as outline above.

    PARAMETERS:

        * URL URL is page to get HAR data for
        * CALLBACK(ERROR) function
            1. ERROR string if there was an error 
            2. HAR string data

    EXAMPLE: See above

**cbHAR(NAME, GENERATE_TRAFFIC_CALLBACK, HAR_CALLBACK)**

    Convenience method to get HAR data - this method allows you to generate whatever traffic you like (via the CALLBACK), and then generate the HAR file.  

    PARAMETERS:

        * NAME is an abritrary name for this run - like 'yahoo.com' or whatever you like.
        * GENERATE_TRAFFIC_CALLBACK(PROXY, DONE_CALLBACK)

            PARAMETERS: 

                * PROXY is the proxy you must use which is a string of the form '<hostname>:<port>'.  All traffic you generate that you want to be part of the HAR must use this proxy!  That is the whole point of this thing.
                * DONE_CALLBACK is the function you call when you are done generating traffic and are ready to generate the HAR file.

        * HAR_CALLBACK(ERROR, HAR) function 
            1. ERROR string if there was an error 
            2. HAR string data

    EXAMPLE:

Javascript:

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

Note you MUST use 'firefox' or 'ie' browser and note how I must set the Selenium proxy to go thru browsermob-proxy.  I have both Selenium server standalone and browsermob-proxy running on localhost on their default ports (4444 and 8080 respectively).

Here is an exaple using PhantomJS/CasperJS - no Selenium required! - you pass the path to a CasperJS script and all of its interactions will be captured: 

Javascript: 

    var Proxy = require('browsermob-proxy').Proxy
        , spawn = require('child_process').spawn
        , fs = require('fs')
        , proxy = new Proxy()
    ;

    proxy.cbHAR('search.yahoo.com', doCasperJSStuff, function(err, data) {
            if (err) {
                console.error('ERR: ' + err);
            } else {
                fs.writeFileSync('search.yahoo.com.har', data, 'utf8');
            }   
    });

    function doCasperJSStuff(proxy, cb) {
        casperjs = spawn('bin/casperjs', [ '--proxy=' + proxy, process.argv[2] ] );
        casperjs.on('exit', cb);
    }

And here is a CasperJS script:

Javascript:

    var casper = require('casper').create();                                                                                                                                  

    casper.start('http://search.yahoo.com/', function() {
        this.fill('form#sf', { "p": 'javascript' }, false);
        this.click('#yschbt');
    });

    casper.run(function() {
        this.exit();
    });

Putting it all together:

    % node runCasper.js searchYahooCasper.js

What is interesting here is you can spawn off ANY process that generates web traffic thru the supplied proxy to generate the HAR - so run wild!

Bandwidth Limits
----------------

In the Proxy constructor you can specify bandwidth and latency limitations like so:

    var proxy = new Proxy( { downloadKbps => 56, uploadKbps => 56, latency 200 } );

Would tell the proxy to act like a 56K modem with 200ms latency.

Gory Details
------------

You can control the browsermob-proxy directly if you want even finer-grained control using methods mapped directly to its REST interface.  Here is an example:

Javascript:

    var webdriverjs = require("webdriverjs")
        , Proxy = require('browsermob-proxy').Proxy
        , fs = require('fs')
        , proxyHost = 'localhost'
        ;

        var proxy = new Proxy( { host: proxyHost });
        proxy.start(function(err, data) {
            if (!err) {
                proxy.startHAR(data.port, 'http://search.yahoo.com', function(err, resp) {
                    if (!err) {
                        // DO WHATEVER WEB INTERFACTION YOU WANT USING THE PROXY
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
                        proxy.stop(data.port,function() {});
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
            , desiredCapabilities: { browserName: 'chrome', seleniumProtocol: 'WebDriver', proxy: { httpProxy: proxy, proxyType: 'DIRECT'  } }
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

In this example I am manually controlling the browsermob-proxy - the convenenice methods 'doHAR' and 'cbHAR' do most of this stuff for you so use them!

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
    
    Initiailizes a proxy

    PARAMETERS:

        * an optional PORT paramter specifying which port to open up a proxy on - if not provided browsermob will pick one.
        * CALLBACK(ERROR, DATA) function 
            1. ERROR string if there was an error 
            2. DATA object whose only memeber is 'port' - the port the proxy is listening on

**startHAR(PORT, [ NAME ], CALLBACK)**

    Instructs the proxy listening on the given port to start generating the HAR - after this call all traffic thru this proxy will become part of the HAR

    PARAMETERS:

        * PORT of proxy for this command
        * Optional NAME for this HAR
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

