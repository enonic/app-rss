var libs = {
	portal: require('/lib/xp/portal'),
	util: require('/lib/enonic/util')
};

var appNamePath = app.name.replace(/\./g,'-');


function getConfig() {
	return libs.portal.getSiteConfig();
}

exports.whatever = function(xxx) {
	var siteConfig = getConfig();
	var yyy = "";

	// Defaults:
	//siteConfig.updatePeriod
	//siteConfig.updateFrequency

	return yyy;
};
