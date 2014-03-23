var bb_allocator = require('../../../parts/bb_allocator.js');
function get_by_cli_id(array, cli_id, push){
    for(key in array){
	if(array[key][0] == cli_id){
	    var value = array[key][1];
	    delete array[key];
	    return value;    
	}
    }
    return null;	    
}
function response_holder(_incoming, modules){
    var ids = new bb_allocator.create(bb_allocator.id_allocator);
    var responses = [];
    this.delayed_packets = [];
    var extra_cleaner_timer = null; //extra connection cleaner

    var _packets = this.delayed_packets;

    this.get_waited_response = function(cli_id){
	if(responses.length)
	    return responses[cli_id].pop();
	return null;
    }

    this.activate = function(context){
	extra_cleaner_timer = modules.timer.js.create(
	    function(){
		//если много ждёт, то завершаем и оставляем не более 3
		for(cli_id in responses){				 
		    while(responses[cli_id].length > 2){
			responses[cli_id].pop().end();
		    }
		}
	    }, 500, true);

	ids.alloc();

	//нужно выбирать доступный http_responder
	modules.http_responder.on_recv(context, 
				       function(content, response){
					   //проверить активно ли соединение
					   response.on_close(
					       function(){
						   for(key in responses[_content.cli_id]){
						       if(responses[_content.cli_id][key] == response){
							   responses[_content.cli_id].splice(key,1);
							   console.log('eeee');
						       }
						   }
					       });

					   var _content = JSON.parse(content);
					   
					   //client is connecting, first msg
					   var msg_connect = false;
					   if(_content.cli_id == 0){
					       _content.cli_id = ids.alloc();
					       msg_connect = true;
					   }
					   
					   //new msg
					   if(_content.hasOwnProperty('msg'))
					       _incoming.add(_content);
					   
					   //send delayed packet
					   if(_packets.length){
					       var packet = get_by_cli_id(_packets, _content.cli_id);
					       if(packet)
						   response.end(packet);
					   } else 
					       if(msg_connect)
						   //client is connecting, send allocated cli_id back
						   response.end(JSON.stringify({"cli_id" : _content.cli_id}));
					   else {
					       //nothing to send, save response object on the future
					       if(typeof(responses[_content.cli_id]) == 'undefined')
						   responses[_content.cli_id] = [];
					       responses[_content.cli_id].push(response);	     
					   }
				       },
				       function(error){console.log('response_holder is failed', error)})    
    }

    this.deactivate = function(context){
	modules.http_responder.remove_callback(context);	
	extra_cleaner_timer.close();
    }
}

function packet_sender(_holder){
    this.send = function(msg){
	var response = _holder.get_waited_response(msg.cli_id);
	if(response)
	    response.end(JSON.stringify(msg));
	else
	    _holder.delayed_packets.push([msg.cli_id, JSON.stringify(msg)]);
    }
}

exports.create = function(context, modules){
    var utils = require('../../../parts/utils.js');
    var _incoming = new utils.msg_queue();
    var _holder = new response_holder(_incoming, modules);
    var _sender = new packet_sender(_holder);
    
    return {
	'listen' : function(){
	    _holder.activate(context);
	},
	'on_connect' : function(connect_cb){
	    var clients = {};
	    _incoming.on_add(function(msg){
				 if(typeof(clients[msg.cli_id]) == 'undefined'){
				     connect_cb({	    
						   'send' : function(data){
						       _sender.send({"cli_id" : msg.cli_id, "msg" : data})
						   },
						   'on_recv' : function(callback){
						       clients[msg.cli_id] = callback;  
						   }
					       });
				 } else
				     clients[msg.cli_id](msg.msg);
			     });
	},
	'close' : function(){
	    _holder.deactivate(context);
	}	    
	
    }
}
