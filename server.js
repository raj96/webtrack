const express = require('express');
const fs = require('fs');
const url = require('url');
const qs = require('querystring');

var app = express();

var onlineUserJSON = [];
/*onlineUserJSON structure
{
	'uname':'some_name',
	'lat':'some_lat',
	'long':'some_long'
}
*/
app.use('/public',express.static('public'));
app.use('/private',express.static('private'));

function findUser(name) {
	if(onlineUserJSON==undefined)
		return -1;
	var i = 0;
	for(i=0;i<onlineUserJSON.length;i++) {
		console.log(onlineUserJSON[i].uname);
		if(onlineUserJSON[i].uname==name)
			return i;
	}
	return -1;
}

app.post('/remove',function(req,res){
	var body = '';
	req.on('data',function(data){
		body+=data;
		if(body.length>1e6)
			req.connection.destroy();
	});
	req.on('end',function(){
		var udata = qs.parse(body);
		console.log("Going to delete: "+udata.uid);
		delete onlineUserJSON[Number(udata.uid)];
	});
});

app.post('/tryUser',function(req,res) {
	var body = '';
	var uname;
	req.on('data',function(data){
		body += data;
		if(body.length>1e6)
			req.connection.destroy();
	});
	req.on('end',function(){
		var udata = qs.parse(body);
		console.log(udata);
		uname = udata.hostName;
		console.log(uname);
		var stat = findUser(uname);
		res.writeHead(200,{'Content-Type':'text/plain'});
		if(stat!=-1)
			res.write(String(-1));
		else {
			onlineUserJSON.push(JSON.parse('{"uname":"'+uname+'","lat":"0","long":"0"}'));
			res.write(String(onlineUserJSON.length-1));
		}
		res.end();
	});
});

app.post('/updateLocation',function(req,res){
	var body = '';
	req.on('data',function(data){
		body += data;
		if(body>1e6)
			req.connection.destroy();
	});
	req.on('end',function(){
		var udata = qs.parse(body);
		console.log(JSON.stringify(udata));
		onlineUserJSON[Number(udata.index)].lat = Number(udata.lat);
		onlineUserJSON[Number(udata.index)].long = Number(udata.long);
		res.end();
	});
});

app.post('/track',function(req,res){
	console.log('Track Called: '+req.url);
	console.log(onlineUserJSON);

	var body='';
	req.on('data', function (data) {
            body += data;
			if (body.length > 1e6)
                req.connection.destroy();
    });

	req.on('end',function() {
		urldata = qs.parse(body);
		var ustat = findUser(urldata.uname);
		console.log(urldata.uname+": "+ustat);

		res.writeHead(200,{'Content-Type':'text/plain'});
		res.write(String(ustat));
		res.end();
	});

});

app.post('/trackLocation',function(req,res){
	var body = '';
	req.on('data',function(data){
		body += data;
		if(body>1e6)
			req.connection.destroy();
	});
	req.on('end',function(){
		var udata = qs.parse(body);
		var uid = Number(udata.uid);
		res.writeHead(200,{'Content-Type':'text/plain'});
		if(onlineUserJSON[uid]==undefined)
			res.write('-1');
		else {
			var locationString = '{"lat":"'+onlineUserJSON[uid].lat+'","long":"'+onlineUserJSON[uid].long+'"}';
			console.log("Track Sent: "+locationString);
			res.write(locationString);
		}
		res.end();
	});
});

app.get('/hostpage',function(req,res){
	fs.readFile('./private/html/hostpage.html',function(err,data){
		if(err){
			res.write("Contact system administrator: "+err);
			res.end();
		}
		else {
			res.writeHead(200,{'Content-Type':'text/html'});
			res.write(data);
			res.end();
		}
	})
});

app.get('/private',function(req,res) {
	res.writeHead(200,{'Content-Type':'text/html'});
	res.write("<h2>Error 404</h2>");
	res.end();
});

app.get('/',function(req,res) {
	fs.readFile('./private/html/index.html',function(err,data) {
		if(err) {
			res.write('Contact system administrator: '+err);
			res.end();
		}
		else {
	 		res.writeHead(200,{'Content-Type':'text/html'});
			res.write(data);
			res.end();
		}
	});
});

app.listen(8080);
