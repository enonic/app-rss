var libs = {
	portal: require('/lib/xp/portal'),
	content: require('/lib/xp/content'),
	thymeleaf: require('/lib/xp/thymeleaf'),
	util: require('/lib/enonic/util')
};

var conf = {
	view: resolve('add-meta.html')
};

exports.responseFilter = function(req, res) {

	var site = libs.portal.getSite();

	libs.util.log(site);

	var result = libs.content.query({
		start: 0,
		count: 100,
		query: "_path LIKE '/content" + site._path + "/*'",
		contentTypes: [
			app.name + ":rss-page"
		]
	});

	libs.util.log(result);

	var params = {
		feeds: result.hits
	};

	var metadata = libs.thymeleaf.render(conf.view, params);

	res.pageContributions.headEnd = libs.util.data.forceArray(res.pageContributions.headEnd);
	res.pageContributions.headEnd.push(metadata);

	if (req.params.debug === 'true') {
		res.applyFilters = false; // Skip other filters
	}

	return res;
};
