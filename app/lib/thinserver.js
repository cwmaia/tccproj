var ThinServer = module.exports = function(){
	this.hostname = Alloy.CFG.thinServerHost;
	this.port = Alloy.CFG.thinServerPort;
	this.connectedSockets = [];
};

ThinServer.prototype.startService = function() {
	var that = this;
	var acceptedCallbacks = {
		error : function(e) {
			Ti.API.error("Socket error: "+e.socket.host);
			Ti.API.error(e.error);
			removeSocket(that.connectedSockets, e.socket);
		}
	};
	

	var socket = Titanium.Network.Socket.createTCP({
		host: this.hostname,
		port: this.port,
		listenQueueSize: 9999,
		accepted: function(e) {
			var sock = e.inbound;
			that.connectedSockets.push(sock);
			Ti.API.info('ACCEPTED: '+sock.host+':'+sock.port);
			socket.accept(acceptedCallbacks);
			Ti.Stream.pump(sock, pumpCallback.bind(that), 1024, true);
		},
		closed: function(e) {
			Ti.API.info("Closed listener");
		},
		error: function(e) {
			Ti.API.error("Listener error: "+e.errorCode);
			Ti.API.error(e.error);
		}
	});
	
	socket.listen();
	Ti.API.info( "Listening on "+socket.host+":"+socket.port);
	socket.accept(acceptedCallbacks);
};

removeSocket = function(connectedSockets, sock) {
	var index = connectedSockets.indexOf(sock);
	if (index != -1) {
		connectedSockets.splice(index,1);
	}	
};
	
pumpCallback = function(e) {
	//Ti.API.info(JSON.stringify(e));
	if (e.bytesProcessed == -1) { // EOF
		Ti.API.info("<EOF> - Closing the remote socket!");
		e.source.close();
		removeSocket(this.connectedSockets, e.source);
	}
	else if (e.errorDescription == null || e.errorDescription == "") {
		var req = e.buffer.toString();
		var verb = req.substring(0, req.indexOf(" ")).trim();
		var resource =  req.substring(req.indexOf(" ")+1,req.indexOf(" HTTP/")).trim();
		
		
		var fileResource = Alloy.Globals.appPath + resource;
		
		Ti.API.info("======>>> Sending "+fileResource);
		var file = Titanium.Filesystem.getFile(fileResource);
		var response = Ti.createBuffer({length: 1024}),
	    stream = Ti.Stream.createStream({mode: Ti.Stream.MODE_WRITE, source: response}),
	    body = '';
	    
	    if(file.exists()) {
		    body = file.read();
		    stream.write(
		        Ti.createBuffer(
		            {
		                value: 'HTTP/1.1 200 OK\n'
		                    + 'Cache-Control:no-cache\n'
		                    + 'Pragma:no-cache\n'
		                    + 'Content-Length: ' + body.length + '\n'
		                    + 'Content-Type: ' + body.getMimeType() + '\n'
		                    + "Date: "+ new Date() +"\n"
		                    + "Connection: close\n"
		                    + "Server: LJS Light Javascript Server\n"
		                    + '\n'
		            }
		        )
		    );
			
			var bodyStream = Titanium.Stream.createStream({
		        mode : Titanium.Stream.MODE_READ,
		        source : body
		    }),
		 
		    bodyBuffer = Ti.createBuffer({
		        length : body.length
		    });
		    while ((bodyStream.read(bodyBuffer)) > 0) {}
		    bodyStream.close();
		 	stream.write(bodyBuffer);
		} else {
			stream.write(
		        Ti.createBuffer(
		            {
		                value: 'HTTP/1.1 404 NOT FOUND\n'
		                    + "Server: LJS Light Javascript Server\n"
		                    + '\n'
		            }
		        )
		    );
		}
		
		for (var index in this.connectedSockets) {
			var sock = this.connectedSockets[index];
			sock.write(response);
			sock.close;
		}
		//connectedSockets[0].write(Ti.createBuffer({value: msg}));
	} else {
		Ti.API.info("READ ERROR: "+e.errorDescription);
		Ti.API.info(JSON.stringify(e));
	}
};

