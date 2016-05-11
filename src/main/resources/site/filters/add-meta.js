var libs = {
    portal: require('/lib/xp/portal'),
    thymeleaf: require('/lib/xp/thymeleaf'),
    util: require('/lib/enonic/util')
};

var conf = {
	view: resolve('add-meta.html')
};


exports.responseFilter = function(req, res) {
/*
	var siteConfig = libs.portal.getSiteConfig();
*/

	var params = {
		title: pageTitle,
		description: libs.site.getMetaDescription(content, site),
		siteName: site.displayName
	};

	var metadata = libs.thymeleaf.render(conf.view, params);

	res.pageContributions.headEnd = libs.util.data.forceArray(res.pageContributions.headEnd);
	res.pageContributions.headEnd.push(metadata);

	if (req.params.debug === 'true') {
		res.applyFilters = false; // Skip other filters
	}

	return res;
};
