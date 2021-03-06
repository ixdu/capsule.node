/*
 * low level storage module for nodejs 
 * API is async
 */

var fs = require('fs');

/*
 * deleting object by id
 */

exports.delete = function(id, cb){
    fs.unlink(id, cb);
    cb();
}

/*
 * writing to object by id. Writing only as appending
 */
exports.append = function(id, data, cb){
    fs.appendFile(id, data, cb);
}

/*
 * reading object by id
 * 
 * cb(err, content); err may be - cannot read as need, nonexistent, underlay_err
 */

exports.read = function(id, position, length, cb){
    var content = new Buffer(length);
    fs.open(id, 'r', function(err, fd){
		if(err)
		    cb(err, null);
		else
		    fs.read(fd, content, 0, length, position, function(err, readed_bytes, content){
				if(readed_bytes != length)
				    cb({ msg : 'readed few' });
				else
				    cb(err, content.toString());
			    });
	    });
}