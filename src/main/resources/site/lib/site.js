var libs = {
	portal: require('/lib/xp/portal'),
	util: require('/lib/enonic/util/util')
};

var appNamePath = app.name.replace(/\./g,'-');
var mixinPath = 'meta-data';

function getConfig() {
	return libs.portal.getSiteConfig();
}
function commaStringToArray(str) {
	var commas = str || '';
	var arr = commas.split(',');
	if (arr) {
		arr.map(function(s) { return s.trim() });
	}
	return arr;
}
function findValueInJson(json, paths) {
	var value = null;
	var pathLength = paths.length;
	var jsonPath = ";"
	for (var i = 0; i < pathLength; i++) {
		if ( paths[i] ) {
			jsonPath = 'json.data["' + paths[i] + '"]'; // Wrap property so we can have dashes in it
			if ( eval(jsonPath) ) {
				value = eval(jsonPath);
				break; // Expect the first property in the string is the most important one to use
			}
		}
	}
	return value;
}

exports.getBlockRobots = function(content) {
	var setInMixin = content.x[appNamePath]
		&& content.x[appNamePath][mixinPath]
		&& content.x[appNamePath][mixinPath].blockRobots;
	return setInMixin;
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

exports.getMetaDescription = function(content, site) {
	var siteConfig = getConfig();

	var userDefinedPaths = siteConfig.pathsDescription || '';
	var userDefinedArray = userDefinedPaths ? commaStringToArray(userDefinedPaths) : [];
	var userDefinedValue = userDefinedPaths ? findValueInJson(content,userDefinedArray) : null;

	var setWithMixin = content.x[appNamePath]
			&& content.x[appNamePath][mixinPath]
			&& content.x[appNamePath][mixinPath].seoDescription;
	var metaDescription = setWithMixin ? content.x[appNamePath][mixinPath].seoDescription // Get from mixin
					: userDefinedValue
					|| content.data.preface || content.data.description || content.data.summary // Use typical content summary names
					|| siteConfig.seoDescription // Use default for site
					|| site.description; // Use bottom default

	return metaDescription;
};

exports.getOpenGraphImage = function(content, defaultImg) {
	var siteConfig = getConfig();

	var userDefinedPaths = siteConfig.pathsImages || '';
	var userDefinedArray = userDefinedPaths ? commaStringToArray(userDefinedPaths) : [];
	var userDefinedValue = userDefinedPaths ? findValueInJson(content,userDefinedArray) : null;

	// Set basic image options
	var imageOpts = {
		scale: 'block(1200,630)', // Open Graph requires 600x315 for landscape format. Double that for retina display.
		quality: 85,
		format: 'jpg',
		type: 'absolute'
	};

	// Try to find an image in the content's image or images properties
	var imageArray = libs.util.data.forceArray( userDefinedValue || content.data.image || content.data.images || []);

	// Set the ID to either the first image in the set or the default image ID
	imageOpts.id = imageArray.length ? imageArray[0] : defaultImg;

	// Return the image URL or nothing
	return imageOpts.id ? libs.portal.imageUrl(imageOpts) : null;
};
