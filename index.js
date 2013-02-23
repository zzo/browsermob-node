/**
 * Copyright (c) 2013 ZZO Associates
 */

var http = require('http')
    , webdriverjs = require("webdriverjs")
;

function Proxy(conf) {
    this.host = (conf && conf.host) || 'localhost';
    this.port = (conf && conf.port) || 8080;
    this.selHost = (conf && conf.selHost) || 'localhost';
    this.selPort = (conf && conf.selPort) || 4444;

    this.downstreamKbps = conf && conf.downstreamKbps;
    this.upstreamKbps = conf && conf.upstreamKbps;
    this.latency = conf && conf.latency;

    /*
     *  downstreamKbps - Sets the downstream kbps
     *  upstreamKbps - Sets the upstream kbps
     *  latency - Add the given latency to each HTTP request
     */
}

Proxy.prototype = {
    selFunc:  function(proxy, url, cb) {
        var browser = webdriverjs.remote({
            host: this.selHost
            , port: this.selPort
            , desiredCapabilities: { browserName: 'firefox', seleniumProtocol: 'WebDriver', proxy: { httpProxy: proxy } }
        });

        browser
            .init()
            .url(url)
            .end(cb);
    },

    cbHAR:  function(name, selCB, cb) {
        var _this = this;
        this.start(function(err, data) {
            if (!err) {
                _this.startHAR(data.port, name, function(err, resp) {
                    if (!err) {
                        selCB(_this.host + ':' + data.port, function () {
                            _this.getHAR(data.port, function(err, resp) {
                                _this.stop(data.port, function() {
                                    if (err) {
                                        cb(err);
                                    } else {
                                        cb(null, resp);
                                    }
                                });
                            });
                        });
                    } else {
                        _this.stop(data.port, function() { cb(err); });
                    }
                });
            } else {
                cb(err);
            }
         });
    },

    start: function(port, cb) {
        var postData = '';
        if (!cb) {
            cb = port;
        }
        if (typeof(port) === 'number') {
            postData = 'port=' + port;
        }

        this.doReq('POST', '/proxy', postData, function(err, data) {
            var obj;
            if (!err) {
                obj = JSON.parse(data);
                cb(null, obj);
            } else {
                cb(err);
            }
        });
    },

    stop: function(port, cb) {
        this.doReq('DELETE', '/proxy/' + port, cb);
    },

    getHAR: function(port, cb) {
        this.doReq('GET', '/proxy/' + port + '/har', cb);
    },

    startHAR: function(port, name, cb) {
        var _this = this
        ;

        if (!cb) {
            cb = name;
            name = 'Page 1';
        }

        this.doReq('PUT', '/proxy/' + port + '/har', 'initialPageRef=' + name, 
            // Check if we need to add in limits
            function(err, data) {
                var limit = false, limitObj = {};

                if (err) {
                    cb(err);
                } else {
                    ['downstreamKbps', 'upstreamKbps', 'latency'].forEach(function(key) {
                        if (_this[key]) {
                            limitObj[key] = _this[key];
                            limit = true;
                        }
                    });
                    if (limit) {
                        _this.limit(port, limitObj, cb);
                    } else {
                        cb(null);
                    }
                }
            }
        );
    },

    newPage: function(port, name, cb) {
        this.doReq('PUT', '/proxy/' + port + '/har/pageRef', 'pageRef=' + name, cb);
    },

    /*
     *  downstreamKbps - Sets the downstream kbps
     *  upstreamKbps - Sets the upstream kbps
     *  latency - Add the given latency to each HTTP request
     */
    limit: function(port, obj, cb) {
        var data = '';
        for (key in obj) {
            data += key + '=' + obj[key] + '&';
        }
        this.doReq('PUT', '/proxy/' + port + '/limit', data, cb);
    },

    doHAR: function(url, cb) {
        var _this = this;
        this.start(function(err, data) {
            if (!err) {
                _this.startHAR(data.port, url, function(err, resp) {
                    if (!err) {
                        _this.selFunc(_this.host + ':' +  data.port, url, function () {
                            _this.getHAR(data.port, function(err, resp) {
                                _this.stop(data.port, function() {
                                    if (err) {
                                        cb(err);
                                    } else {
                                        cb(null, resp);
                                    }
                                });
                            });
                        });
                    } else {
                        _this.stop(data.port, function() { cb(err); });
                    }
                });
            } else {
                cb(err);
            }
         });
    },

    doReq: function(method, url, postData, cb) {

        if (!cb) { // for empty requests
            cb = postData;
        }

        var options = {
            host: this.host
            , port: this.port
            , method: method
            , path: url
        }
        , req = http.request(options, function(res) {
            var data = '';
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function() {
                cb(null, data);
            });
        })
        ;

        req.on('error', cb);

        if (typeof(postData) === 'string') {
            req.write(postData);
        } 
        req.end();
    }
};

module.exports = {
    Proxy: Proxy
};
