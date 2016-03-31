var libs = {
	portal: require('/lib/xp/portal'),
	util: require('/lib/enonic/util')
};

var appNamePath = app.name.replace(/\./g,'-');


function getConfig() {
	return libs.portal.getSiteConfig();
}

exports.getPageTitle = function(content, site) {
	var siteConfig = getConfig();

	var setInMixin = content.x[appNamePath]
		&& content.x[appNamePath][mixinPath]
		&& content.x[appNamePath][mixinPath].seoTitle;

	var userDefinedPaths = siteConfig.pathsTitles || '';
	var userDefinedArray = userDefinedPaths ? commaStringToArray(userDefinedPaths) : [];
	var userDefinedValue = userDefinedPaths ? findValueInJson(content,userDefinedArray) : null;

	var metaTitle = setInMixin ? content.x[appNamePath][mixinPath].seoTitle // Get from mixin
			:  content.displayName // Use content's display name
			|| userDefinedValue // json property defined by user as important
			|| content.data.title || content.data.heading || content.data.header // Use other typical content titles (overrides displayName)
			|| siteConfig.seoTitle // Use default og-title for site
			|| site.displayName; // Use site default

	return metaTitle;
};
