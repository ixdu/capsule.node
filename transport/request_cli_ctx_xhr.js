function request_cli_ctx_xhr(){
    var xhrs = new bb_allocator(xhr_manager); // хранятся тут используемые и использованные XMLHttpRequest
     
    function xhr_manager(){
	this.create = function(){
            //тут видимо должно быть кроссбраузерное создание xmlhttprequest
            return new XMLHttpRequest();
	}
	this.destroy = function(){
            //тут наверное следует задуматься как эти объекты вычищать в разных браузерах
            //надо бы подумать об удалении, но в обычной ситуации скорее будет переиспользоваться
	}
    }
    this.request = function(address){
	this.address = address;
	this.send = function(data, callback){
	    var xhr = xhrs.alloc();
	    xhr.open('POST', address, true);
	    xhr.onreadystatechange = function(){
		if(xhr.readyState == 4){	
		    if(xhr.status == 200){
			callback(xhr.responseText);
		    }
		    xhrs.free(xhr);
		}	    
	    }
	    xhr.send(data);
	}
    }
}

