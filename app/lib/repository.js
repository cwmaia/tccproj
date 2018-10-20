var Repository = module.exports = function(){
	this.repoUrl = Alloy.CFG.repoUrl;
	this.repoResourcesFile = Alloy.CFG.repoResourcesFile;
	this.repoConfig = undefined;
	this.tmpBannerZip = "banner.zip";
	this.tmpGameZip = "game.zip";
};

Repository.prototype.updateAndDownloadGame = function(params) {
	var that = this;
	if(this.repoConfig){
		//alert("updateAndDownloadGame >>>" + JSON.stringify(params.game));
		var xhr = Titanium.Network.createHTTPClient();
		xhr.setTimeout(45000);
		xhr.onload = function(e) {
			var f = Ti.Filesystem.getFile(Alloy.Globals.appPath, that.tmpGameZip);
			f.write(xhr.responseData); // write to the file
			var Compression = require('ti.compression');
		    var result = Compression.unzip(Alloy.Globals.appPath, f.nativePath, true);
		    if (result == 'success') {
		    	var myGames = [];
				if(Ti.App.Properties.getString("myGames")) {
					myGames = JSON.parse(Ti.App.Properties.getString("myGames"));
				}
		    	myGames.push(params.game);
				Ti.App.Properties.setString("myGames", JSON.stringify(myGames));
	
				if(params && params.onsuccess){
		    		params.onsuccess();
		    	}
		    } else {
		    	Ti.API.error("Could not extract game file...");
		    	if(params && params.onerror){
		    		params.onerror();
		    	}
		    }
		};
		xhr.onerror = function(e) {
			Ti.API.error("Could not load banner file...");
			if(params && params.onerror){
	    		params.onerror(e);
	    	}
		};
		
		xhr.open('GET', Alloy.CFG.repoUrl + params.game["file"]);
		xhr.send();
	} else {
		params.onerror();
	}
};

Repository.prototype.updateAndDownloadBanner = function(params) {
	var that = this;
	if(this.repoConfig){
		if(!Ti.App.Properties.getString("banner") || JSON.parse(Ti.App.Properties.getString("banner"))["version"] < this.repoConfig["banner"]["version"]){
			Ti.API.info("Banner is out of date, updating...");
			var xhr = Titanium.Network.createHTTPClient();
			xhr.setTimeout(45000);
			xhr.onload = function(e) {
				var f = Ti.Filesystem.getFile(Alloy.Globals.appPath, that.tmpBannerZip);
				f.write(xhr.responseData); // write to the file
				var Compression = require('ti.compression');
			    var result = Compression.unzip(Alloy.Globals.appPath, f.nativePath, true);
			    if (result == 'success') {
			    	Ti.App.Properties.setString("banner", JSON.stringify(that.repoConfig["banner"]));
			    	if(params && params.onsuccess){
			    		params.onsuccess();
			    	}
			    } else {
			    	Ti.API.error("Could not extract banner file...");
			    	if(params && params.onerror){
			    		params.onerror();
			    	}
			    }
			};
			xhr.onerror = function(e) {
				Ti.API.error("Could not load banner file...");
				if(params && params.onerror){
		    		params.onerror(e);
		    	}
			};
			
			xhr.open('GET', Alloy.CFG.repoUrl + that.repoConfig["banner"]["file"]);
			xhr.send();
		} else {
			Ti.API.info("Banner is up to date...");
			params.onsuccess();
		}
	} else {
		params.onerror();
	}
};

Repository.prototype.updateGames = function(params) {
	var that = this;
	if(this.repoConfig){
		Ti.App.Properties.setString("games", JSON.stringify(that.repoConfig["games"]));
		params.onsuccess();
	} else {
		params.onerror();
	}
};


Repository.prototype.load = function(params) {
	var that = this;
	var xhr = Titanium.Network.createHTTPClient();
	xhr.setTimeout(45000);
	xhr.onload = function(e) {
		that.repoConfig = JSON.parse(this.responseText);
		Ti.API.info("Repository loaded...");
		if(params && params.onload){
			params.onload(this);
		}
	};
	xhr.onerror = function(e) {
		Ti.API.error("Could not load the repository...");
		if(params && params.onerror){
			params.onerror(this);
		}
	};
	xhr.open('GET', this.repoUrl + this.repoResourcesFile);
	xhr.send();
};