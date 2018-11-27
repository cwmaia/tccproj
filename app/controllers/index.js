var ts = new(require('thinserver'))();
var repo = new(require('repository'))();
var proxy = new(require('resource_proxy'))();

//ThinServer <- I/O
startThinServer();
//update the banner and the asset list
update();


function startThinServer() {
	ts.startService();
}


//Titanium Lifecycle method, before loading
function update() {
	repo.load(
		{
			//test after update and has no connection...
			onerror: function(){
				renderBanner();
				renderassets();
			},
			onload: function(){
				repo.updateAndDownloadBanner(
					{
						onsuccess: function() {
							renderBanner();
						},
						onerror: function(){
							renderBanner();
						}
					}
				);
				repo.updateassets(
					{
						onsuccess: function() {
							renderassets();
						},
						onerror: function(){
							renderassets();
						}
					}
				);
				
			}
		}
	);
}

function renderassets() {
	var scrollableView = $.UI.create('ScrollableView', {
    	id: "scrollableView",
    	showPagingControl: true
    });
	
	if(Ti.App.Properties.getString("assets")) {
		var myassets = renderMyassets(scrollableView);
		var remoteassets = JSON.parse(Ti.App.Properties.getString("assets"));
		
		for(var i in remoteassets) {
			var asset = remoteassets[i];
			var myasset = _.where(myassets, {id: asset["id"]})[0];
			if(!myasset) {
				scrollableView.addView(createassetView(asset));
			}
		}
		$.asset_list.removeAllChildren();
		$.asset_list.add(scrollableView);
		var onOpen = function(){
			$.asset_list.animate({opacity:1, duration:500});
			$.index.removeEventListener("postlayout", onOpen);
		};
		$.index.addEventListener("postlayout", onOpen);
		$.index.open(); //ui transition methods
	} else {
		alert("Could not load assets.");
	}
}
function renderMyassets(scrollableView) {
	var myassets = JSON.parse(Ti.App.Properties.getString("myassets"));
	for(var i in myassets) {
		var asset = myassets[i];
		scrollableView.addView(createassetView(asset));
	}
	return myassets;
}
function createassetView(asset) {
	/*
	<View class="assetViewWraper">--
	    <View class="assetView">--
	    	<ImageView class="assetIcon"></ImageView>
	    	<Label class="assetTitle" text="Quadrado"></Label>
	    	<Button class="assetButton" title="JOGAR"></Button>
	    </View>
	</View>
	*/

	var assetViewWraper = $.UI.create('View', {
    	classes: ["assetViewWraper"]
    });
    
    var assetView = $.UI.create('View', {
    	classes: ["assetView"]
    });
    assetView.add(
		$.UI.create('ImageView', {
			classes: ["assetIcon"]
		})
	);
	assetView.add(
		$.UI.create('Label', {
			classes: ["assetTitle"],
			text: asset["name"]
		})
	);
	var playButton = $.UI.create('Button', {
			classes: ["assetButton"],
			title: "JOGAR"
	});
	playButton.addEventListener("click", function(){
		downloadAndPlay({
			asset: asset,
			onerror: function() {
				playButton.setTitle("JOGAR");
				playButton.setTouchEnabled( true );
			},
			onsuccess: function() {
				playButton.setTitle("JOGAR");
				playButton.setTouchEnabled( true );
			},
			ondownloadstart: function() {
				playButton.setTitle("...");
				playButton.setTouchEnabled( false );
			}
		});
	}.bind({asset: asset}));
	assetView.add(playButton);
    assetViewWraper.add(assetView);
	return assetViewWraper;
}

function downloadAndPlay(params){
	var _ = require('alloy/underscore')._;
	//alert(JSON.stringify(asset));
	//search the file by id/ download and install
	var myassets = [];
	var remoteassets = [];
	if(Ti.App.Properties.getString("myassets")) {
		myassets = JSON.parse(Ti.App.Properties.getString("myassets"));
	}
	if(Ti.App.Properties.getString("assets")) {
		remoteassets = JSON.parse(Ti.App.Properties.getString("assets"));	
	}
	var myasset = _.where(myassets, {id: params.asset["id"]})[0];
	var remoteasset = _.where(remoteassets, {id: params.asset["id"]})[0];
	if(!remoteasset) {
		if(!myasset){
			alert("Não foi possível encontrar o jogo no repositótio");
			if(params && params.onerror){
	    		params.onerror();
	    	}
		} else {
	    	if(params && params.onsuccess){
	    		play(myasset);
	    		params.onsuccess();
	    	}
		}
	} else { //if its not up to date, download and play
		if(!myasset || remoteasset["version"] > myasset["version"]){
			Ti.API.info("asset "+params.asset["id"]+" is out of date, updating...");
			if(params && params.ondownloadstart){
	    		params.ondownloadstart();
	    	}
			repo.updateAndDownloadasset(
				{
					asset: params.asset,
					onsuccess: function() {
						play(params.asset);
						if(params && params.onsuccess){
				    		params.onsuccess();
				    	}
					},
					onerror: function(){
						if(!myasset) {
							// alert("Update Assset Failed");
						} else {
							play(myasset);
						}
						if(params && params.onerror){
				    		params.onerror();
				    	}
					}
				}
			);
		} else {
			Ti.API.info("asset "+params.asset["id"]+" is up to date...");
			play(params.asset);
			if(params && params.onsuccess){
	    		params.onsuccess();
	    	}
		}
	}
}

//TODO open in a webview... (problem with local storage)
function play(asset) {
	$.webviewBanner.url = "http://" + Alloy.CFG.thinServerHost + ":" + Alloy.CFG.thinServerPort + "/" + asset["id"] + "/index.html";
} //play calls index.html of the resource from within the thinserver
//webview banner is the resource viewer

function renderBanner() {
	$.webviewBanner.addEventListener('load', function() {
		proxy.appyProxyRule($.webviewBanner); //proxy checks on all resource viewer request
	});
	$.webviewBanner.addEventListener('load', function(e) {
		//$.logo.animate({opacity:0, duration:500});
   		//$.webviewBanner.animate({opacity:1, duration:500});
   		$.webviewBanner.setOpacity(1);
	});
	if(Ti.App.Properties.getString("banner")) {
		var banner = JSON.parse(Ti.App.Properties.getString("banner"));
		$.webviewBanner.url = "http://" + Alloy.CFG.thinServerHost + ":" + Alloy.CFG.thinServerPort + "/" + banner["id"] + "/index.html";
	}
}
