exports.main = function(env){
    var capsule = env.capsule;
    capsule.tests.modules.transport.direct.test(capsule);
    capsule.tests.modules.timer.test(capsule);
    
    console.log(JSON.stringify(capsule.modules.transport.http));
    var thsocket = capsule.tests.modules.transport.http.socket_cli;
    
    thsocket.test({ 'url' : 'http://localhost:8810/sockethh.js', 'method' : 'POST'}, capsule.modules);
    
    var thttp = capsule.tests.modules.transport.http.client;
    
    //thttp.test({ 'url' : 'http://localhost:8810/privetiki', 'method' : 'POST'}, capsule.modules);

}


