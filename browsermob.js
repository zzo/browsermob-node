var http = require('http')
    , webdriverjs = require("webdriverjs")
    ;

module.exports = {
    Proxy: function(conf) {
        var host = (conf && conf.host) || 'localhost'
            , port = (conf && conf.port) || 8080
            , selHost = (conf && conf.selHost) || 'localhost'
            , selPort = (conf && conf.selPort) || 4444
            , baseURL = 'http://' + host + ':' + port + '/'
        ;

        this.selFunc = function(proxy, url, cb) {
            var browser = webdriverjs.remote({
                host: selHost
                , port: selPort
                , desiredCapabilities: { browserName: 'firefox', seleniumProtocol: 'WebDriver', proxy: { httpProxy: proxy } }
            });

            browser
                .init()
                .url(url)
                .end(cb);
        };

        this.selHAR = function(name, selCB, cb) {
            var _this = this;
            this.start(function(err, data) {
                if (!err) {
                    _this.startHAR(data.port, name, function(err, resp) {
                        if (!err) {
                            selCB('localhost:' +  data.port, function () {
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
        };

        this.start = function(port, cb) {
            var postData = '';
            if (!cb) {
                cb = port;
            }
            if (typeof(port) === 'Number') {
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
        };

        this.stop = function(port, cb) {
            this.doReq('DELETE', '/proxy/' + port, cb);
        };

        this.getHAR = function(port, cb) {
            this.doReq('GET', '/proxy/' + port + '/har', cb);
        };

        this.startHAR = function(port, name, cb) {
            if (!cb) {
                cb = name;
                name = 'Page 1';
            }
            this.doReq('PUT', '/proxy/' + port + '/har', 'initialPageRef=' + name, cb);
        };

        this.newPage = function(port, name, cb) {
            this.doReq('PUT', '/proxy/' + port + '/har', 'pageRef=' + name, cb);
        };

        /*
         *  downstreamKbps - Sets the downstream kbps
         *  upstreamKbps - Sets the upstream kbps
         *  latency - Add the given latency to each HTTP request
         */
        this.limit = function(port, obj, cb) {
            var data = '';
            for (key in obj) {
                data += key + '=' + obj[key] + '&';
            }
            this.doReq('PUT', '/proxy/' + port + '/limit', data, cb);
        };

        this.doHAR = function(url, cb) {
            var _this = this;
            this.start(function(err, data) {
                if (!err) {
                    _this.startHAR(data.port, url, function(err, resp) {
                        if (!err) {
                            _this.selFunc('localhost:' +  data.port, url, function () {
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
        };


        this.doReq = function(method, url, data, cb) {

            if (!cb) { // for empty requests
                cb = data;
            }

            var options = {
                host: host
                , port: port
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

            if (typeof(data) === 'String') {
                req.write(data);
            }
            req.end();
        }
    }
};
