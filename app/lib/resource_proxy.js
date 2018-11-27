var Proxy = module.exports = function(){
	this.repoUrl = Alloy.CFG.repoUrl;
	this.repoResourcesFile = Alloy.CFG.repoResourcesFile;
};
// regulates what if request must be redirected based on configuration before moving to resource viewer
Proxy.prototype.appyProxyRule = function(webview) {
	var that = this;
	//alert('beforeload: ' + webview.url);
	//alert(Alloy.Globals.proxyRules);
	Alloy.Globals.proxyRules.forEach(rule => {
		if(webview.url.match(new RegExp(rule.intercept))){
			if(rule.action == "rewriteServer"){
				webview.stopLoading();
				webview.url = webview.url.replace(new RegExp(rule.intercept), rule.to);
			}
		}
	})
};