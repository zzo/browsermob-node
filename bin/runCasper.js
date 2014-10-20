#!/usr/bin/env node

var Proxy = require('browsermob-proxy').Proxy                                                                                                                             
    , spawn = require('child_process').spawn
    , fs = require('fs')
    , name = process.argv[2]
    , proxy = new Proxy()
;

if (!name) {
    console.error('Must specify a CasperJS file to run!');
    process.exit(1);
}

proxy.cbHAR(name, doCasperJSStuff, function(err, data) {
        if (err) {
            console.error('ERR: ' + err);
        } else {
            fs.writeFileSync(name + '.har', data, 'utf8');
        }   
});

function doCasperJSStuff(proxy, cb) {
    casperjs = spawn('casperjs', [ '--proxy=' + proxy, name ] );
    casperjs.on('exit', cb);
    casperjs.on('error', function(e) {
        console.error('Error spawing CasperJS job - is "casperjs" in your PATH?');
    });
}
    
