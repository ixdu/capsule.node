exports.backends = {
    'script' : 1,
    'iframe' : 2,
    'xhr' : 3
}

var max_packet_size = 2000;

var transport = require('transport.js');

function msg_package(msg, packets, on_done_callback){
//    this.
}

function msg_unpacker(socket){
    
}

var packet = {
    'i' : '', //id
    'd' : '' //data
}

var frame = {
    'length' : '',
    'packets' : []
}

function msg_packer(socket, msg){
    var packets = []; //[msg_id, packet_number,
    //разбиваем сообщение на пакеты и записываем в пакеты пакеты
}
exports.create = function(context, features, modules){
    if(features & transport.features.dealer){
	var socket_cli = require('http/socket_cli.js');
	var socket = socket_cli.create(context, modules);
	
	return {
	    'on_msg' : function(msg_id, callback){
		
	    },
	    'send' : function(msg, callback){
		
	    },
	    'destroy' : function(){
	    }
	}
    }
    else if(features & transport.features.router){
	var socket_srv = require('http/socket_srv.js');
	var socket = socket_srv.create(context, modules);
	return {
	    'on_msg' : function(msg_id, callback){
		
	    },
	    'send' : function(msg, callback){
	    },
	    'destroy' : function(){
	    }
	}
    }
}