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
	if(onlineUserJSON[name]==undefined)
		return -1;
	return 0;
}

function getSecret(secret_num,secret_string) {
	var secret = "";
	if(secret_num<0)
		secret_num *= -1;
	for(i=1;i<5;i++)
		secret += secret_string[(Math.round(secret_num/(i*100))+(Math.round(Math.random())*i*621098))%26];

	return secret;

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
		console.log("Going to delete: "+udata.uname);
		delete onlineUserJSON[udata.uname];
	});
});

app.post('/getUser',function(req,res){
	var date = new Date();
	var first_secret = date.getYear()+date.getMilliseconds()+date.getHours();
	var second_secret = date.getMonth()+date.getTimezoneOffset();
	var third_secret = (Math.round((first_secret*second_secret)/(first_secret+second_secret)))%date.getTime();
	var fourth_secret = (Math.round(Math.random()*third_secret*-1));
	var big_secret = getSecret(fourth_secret,'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
	if(fourth_secret<0)
		fourth_secret *= -1;
	if(third_secret<0)
		third_secret *= -1;
	secret = fourth_secret+big_secret+third_secret;
	console.log(secret);
	res.writeHead(200,{'Content-Type':'text/plain'});
	res.write(secret);
	res.end();
});

app.post('/tryUser',function(req,res) {
	console.log('tryUser called');

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
		uname = udata.uname;
		console.log(uname);

		var stat = findUser(uname);
		res.writeHead(200,{'Content-Type':'text/plain'});
		if(stat==0){
			res.write("-1");			//User not available
			console.log("-1");
		}
		else {
			onlineUserJSON[uname] = (JSON.parse('{"uname":"'+uname+'","lat":"0","long":"0"}'));
			console.log(onlineUserJSON[uname]);
			res.write('0');
		}
		res.end();
	});
});

app.post('/updateLocation',function(req,res){
	console.log("Update Called");
	var body = '';

	req.on('data',function(data){
		body += data;
		if(body>1e6)
			req.connection.destroy();
	});

	req.on('end',function(){
		var udata = qs.parse(body);
		console.log("Old: "+JSON.stringify(onlineUserJSON[udata.uname]));
		res.writeHead(200,{'Content-Type':'text/plain'});
		if(onlineUserJSON[udata.uname]!=undefined)	{
			onlineUserJSON[udata.uname].lat = Number(udata.lat);
			onlineUserJSON[udata.uname].long = Number(udata.long);
			console.log("New: "+JSON.stringify(onlineUserJSON[udata.uname]));
		}
		else {
			delete onlineUserJSON[udata.uname];
			res.write('-1');
		}
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
		var uname = udata.uname;
		res.writeHead(200,{'Content-Type':'text/plain'});
		if(onlineUserJSON[uname]==undefined)
			res.write('-1');
		else {
			var locationString = '{"lat":"'+onlineUserJSON[uname].lat+'","long":"'+onlineUserJSON[uname].long+'"}';
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
