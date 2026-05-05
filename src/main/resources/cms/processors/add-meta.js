var libs = {
	portal: require('/lib/xp/portal'),
	content: require('/lib/xp/content'),
    thymeleaf: require('/lib/thymeleaf'),
    util: require('/lib/util')
};

var conf = {
	view: resolve('add-meta.html')
};

exports.responseProcessor = function (req, res) {
	var site = libs.portal.getSite();

	// Find all RSS feeds active on the current site
	var result = libs.content.query({
		start: 0,
		count: 100,
		query: "_path LIKE '/content" + site._path + "/*'",
		contentTypes: [
			app.name + ":rss-page"
		]
	});

	var params = {
		feeds: result.hits
	};

	var metadata = libs.thymeleaf.render(conf.view, params);

	// Add these to the site html head (can be picked up by browsers and other readers)
	res.pageContributions.headEnd = libs.util.data.forceArray(res.pageContributions.headEnd);
	res.pageContributions.headEnd.push(metadata);

	if (req.params.debug === 'true') {
		res.applyFilters = false; // Skip other filters
	}

	return res;
};
