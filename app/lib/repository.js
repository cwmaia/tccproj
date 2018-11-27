var Repository = module.exports = function(){
	this.repoUrl = Alloy.CFG.repoUrl;
	this.repoResourcesFile = Alloy.CFG.repoResourcesFile;
	this.repoConfig = undefined;
	this.tmpBannerZip = "banner.zip";
	this.tmpassetZip = "asset.zip";
};
//goes to github to download and install github resources
Repository.prototype.updateAndDownloadasset = function(params) {
	var that = this;
	if(this.repoConfig){
		//alert("updateAndDownloadasset >>>" + JSON.stringify(params.asset));
		var xhr = Titanium.Network.createHTTPClient();
		xhr.setTimeout(45000);
		xhr.onload = function(e) {
			var f = Ti.Filesystem.getFile(Alloy.Globals.appPath, that.tmpassetZip);
			f.write(xhr.responseData); // write to the file
			var Compression = require('ti.compression');
		    var result = Compression.unzip(Alloy.Globals.appPath, f.nativePath, true);
		    if (result == 'success') {
		    	var myassets = [];
				if(Ti.App.Properties.getString("myassets")) {
					myassets = JSON.parse(Ti.App.Properties.getString("myassets"));
				}
		    	myassets.push(params.asset);
				Ti.App.Properties.setString("myassets", JSON.stringify(myassets));
	
				if(params && params.onsuccess){
		    		params.onsuccess();
		    	}
		    } else {
		    	Ti.API.error("Could not extract asset file...");
		    	if(params && params.onerror){
		    		params.onerror();
		    	}
		    }
		};
		xhr.onerror = function(e) {
			alert(JSON.stringify(e));
			if(params && params.onerror){
	    		params.onerror(e);
	    	}
		};
		
		xhr.open('GET', Alloy.CFG.repoUrl + params.asset["file"]);
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

Repository.prototype.updateassets = function(params) {
	var that = this;
	if(this.repoConfig){
		Ti.App.Properties.setString("assets", JSON.stringify(that.repoConfig["assets"]));
		params.onsuccess();
	} else {
		params.onerror();
	}
};

// read the resource file on the remote repository
Repository.prototype.load = function(params) {
	var that = this;
	var xhr = Titanium.Network.createHTTPClient();
	xhr.setTimeout(45000);
	xhr.onload = function(e) {
		that.repoConfig = JSON.parse(this.responseText);
		Alloy.Globals.proxyRules = that.repoConfig.proxyRules;
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