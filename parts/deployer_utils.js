var fs = require('fs');

var types = {"envelop" : 1,
		 "module" : 2,
		 "script" : 3
		};

function tree_walker(tree, assembler){
    for(var key in tree){
	if(typeof(tree[key]) == 'boolean')
	    assembler.set_flag(key,tree[key]);

	if(typeof(tree[key]) == 'string'){
	    if(key == 'type')
		assembler.set_type(tree[key]);
	    else 
		assembler.do_file(key, tree[key]);
	}
	else if(typeof(tree[key]) == 'object'){
	    var child_assembler = assembler.find_child(key);
	    if(!child_assembler){
		var state = assembler.pop_state();
		var child_assembler = assembler.create_child(key);
		child_assembler.push_state(state);		
	    }
	    tree_walker(tree[key], child_assembler);
	}
    }
}

function assembler_constructor(dir){
    this.dir = dir;
    this.s = {
	flags : { 'preload' : false
		},
	type : types.envelope
    }

    this.childs = [];
    

    this.set_flag = function(name, value){
	this.s.flags[name] = value;
    }
    
    this.set_type = function(name){
	if(types.hasOwnProperty(name)){
	    this.s.type = types[name];
	}else
	    console.log('unexpectial type')
    }
    
    this.push_state = function(state){
	this.s = JSON.parse(JSON.stringify(state))
    }

    this.pop_state = function(){
	return this.s;
    }

    this.create_child = function(name){
	var assembler = this.constructor(dir);
	this.childs.push([name, assembler]);
	return assembler;
    }

    this.find_child = function(name){
	for(child in this.childs){
	    if(this.childs[child][0] == name)
		return this.childs[child][1];
	}
	return null;
    }
}

exports.tree_walker = tree_walker;

exports.assembler_constructor = assembler_constructor;

exports.types = types;

exports.config = function(dir){
    try {
	this.values = JSON.parse(fs.readFileSync(dir + '/config.json').toString());		
        this.write = function(){
	    fs.writeFile(dir + '/config.json', JSON.stringify(this.values));
	}	
    } catch (x) {
	console.log('config.json не существует, а надо бы');
	console.log(x.message);
    }    
}

exports.assemble = function(dir, assembler){    
    var filenames = fs.readdirSync(dir);
    for(ind in filenames){
	if(filenames[ind].substr(filenames[ind].length - 4,4) == 'json' &&
	   filenames[ind] != 'config.json'){
	    tree_walker(JSON.parse(fs.readFileSync(dir + '/' + filenames[ind]).toString()), assembler);
	}
    }

    dir += '/assembled/';
    if(!fs.existsSync(dir))
	fs.mkdir(dir);

    return assembler.generate();
}