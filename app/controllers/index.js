var ts = new(require('thinserver'))();
var repo = new(require('repository'))();

//first start the service...
startThinServer();
//update the banner and the game list
update();


function startThinServer() {
	ts.startService();
}

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
			var game = remoteassets[i];
			var myGame = _.where(myassets, {id: game["id"]})[0];
			if(!myGame) {
				scrollableView.addView(createGameView(game));
			}
		}
		$.game_list.removeAllChildren();
		$.game_list.add(scrollableView);
		var onOpen = function(){
			$.game_list.animate({opacity:1, duration:500});
			$.index.removeEventListener("postlayout", onOpen);
		};
		$.index.addEventListener("postlayout", onOpen);
		$.index.open();
	} else {
		alert("Could not load assets.");
	}
}
function renderMyassets(scrollableView) {
	var myassets = JSON.parse(Ti.App.Properties.getString("myassets"));
	for(var i in myassets) {
		var game = myassets[i];
		scrollableView.addView(createGameView(game));
	}
	return myassets;
}
function createGameView(game) {
	/*
	<View class="gameViewWraper">--
	    <View class="gameView">--
	    	<ImageView class="gameIcon"></ImageView>
	    	<Label class="gameTitle" text="Quadrado"></Label>
	    	<Button class="gameButton" title="JOGAR"></Button>
	    </View>
	</View>
	*/

	var gameViewWraper = $.UI.create('View', {
    	classes: ["gameViewWraper"]
    });
    
    var gameView = $.UI.create('View', {
    	classes: ["gameView"]
    });
    gameView.add(
		$.UI.create('ImageView', {
			classes: ["gameIcon"]
		})
	);
	gameView.add(
		$.UI.create('Label', {
			classes: ["gameTitle"],
			text: game["name"]
		})
	);
	var playButton = $.UI.create('Button', {
			classes: ["gameButton"],
			title: "JOGAR"
	});
	playButton.addEventListener("click", function(){
		downloadAndPlay({
			game: game,
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
	}.bind({game: game}));
	gameView.add(playButton);
    gameViewWraper.add(gameView);
	return gameViewWraper;
}

function downloadAndPlay(params){
	var _ = require('alloy/underscore')._;
	//alert(JSON.stringify(game));
	var myassets = [];
	var remoteassets = [];
	if(Ti.App.Properties.getString("myassets")) {
		myassets = JSON.parse(Ti.App.Properties.getString("myassets"));
	}
	if(Ti.App.Properties.getString("assets")) {
		remoteassets = JSON.parse(Ti.App.Properties.getString("assets"));	
	}
	var myGame = _.where(myassets, {id: params.game["id"]})[0];
	var remoteGame = _.where(remoteassets, {id: params.game["id"]})[0];
	if(!remoteGame) {
		if(!myGame){
			alert("Não foi possível encontrar o jogo no repositótio");
			if(params && params.onerror){
	    		params.onerror();
	    	}
		} else {
	    	if(params && params.onsuccess){
	    		play(myGame);
	    		params.onsuccess();
	    	}
		}
	} else {
		if(!myGame || remoteGame["version"] > myGame["version"]){
			Ti.API.info("Game "+params.game["id"]+" is out of date, updating...");
			if(params && params.ondownloadstart){
	    		params.ondownloadstart();
	    	}
			repo.updateAndDownloadGame(
				{
					game: params.game,
					onsuccess: function() {
						play(params.game);
						if(params && params.onsuccess){
				    		params.onsuccess();
				    	}
					},
					onerror: function(){
						if(!myGame) {
							alert("Ocorreu uma falha ao atualizar o game");
						} else {
							play(myGame);
						}
						if(params && params.onerror){
				    		params.onerror();
				    	}
					}
				}
			);
		} else {
			Ti.API.info("Game "+params.game["id"]+" is up to date...");
			play(params.game);
			if(params && params.onsuccess){
	    		params.onsuccess();
	    	}
		}
	}
}

//TODO open in a webview... (problem with local storage)
function play(game) {
	Ti.Platform.openURL("http://" + Alloy.CFG.thinServerHost + ":" + Alloy.CFG.thinServerPort + "/" + game["id"] + "/index.html");
}

function renderBanner() {
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
