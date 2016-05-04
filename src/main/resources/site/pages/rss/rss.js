var libs = {
	content: require('/lib/xp/content'),
	portal: require('/lib/xp/portal'),
	xslt: require('/lib/xp/xslt'),
	util: require('/lib/enonic/util')
};

var view = resolve('rss.xsl');


function commaStringToArray(str) {
	if ( !str || str == '') return null;

	var commas = str || '';
	var arr = commas.split(',');
	if (arr) {
		arr.map(function(s) { return s.trim() });
	}
	return arr;
}

function findValueInJson(json, paths) {
	var value = null;
	if (paths) {
		var pathLength = paths.length;
		var jsonPath = ";"
		for (var i = 0; i < pathLength; i++) {
			if ( paths[i] ) {
				jsonPath = 'json.' + paths[i] + '';
				if ( eval(jsonPath) ) {
					value = eval(jsonPath);
					break; // Expect the first property in the string is the most important one to use
				}
			}
		}
	}
	return value;
}

exports.get = function(req) {

	var content = libs.portal.getContent();
	var site = libs.portal.getSite();
/*
	log.info("*** CONTENT ***");
	libs.util.log(content);
*/

	// TODO: Make lang dynamic, as in: read from site or something
	content.data.language = content.data.language || 'en-US';

	// Find the settings for our RSS
	var settings = {
		title: commaStringToArray(content.data.mapTitle) || ['data.title','displayName'],
		summary: commaStringToArray(content.data.mapSummary) || ['data.preface','data.description','data.summary'],
		date: commaStringToArray(content.data.mapDate) || ['data.publishDate','createdTime'],
		body: commaStringToArray(content.data.mapBody) || ['data.body','data.html','data.text']
	};
/*
	log.info("*** SETTINGS ***");
	libs.util.log(settings);
*/
	var folderPath = site._path; // Only allow content from current Site to populate the RSS feed.

	var pageUrl = libs.portal.pageUrl({
		path: content._path
	});

	// Exclude certain paths from the search, controlled from admin
	var contentRoot = '/content' + folderPath + '/';
	var query = '_path LIKE "' + contentRoot + '*"';
	if ( content.data.exclude ) {
		content.data.exclude = libs.util.data.forceArray(content.data.exclude);
		var excludeLength = content.data.exclude.length;
		for (var i = 0; i < excludeLength; i++) {
			query += ' AND _path NOT LIKE "' + contentRoot + content.data.exclude[i] + '/*"';
		}
	}

	var searchDate = content.data.mapDate || 'data.publishDate';
	searchDate = searchDate.replace("[", ".["); // Add dot since we will remove special characters later
	searchDate = searchDate.replace(/['\[\]]/g, ''); // Safeguard against ['xx'] since data path might need it on special characters paths

//	log.info(searchDate);

	var result = libs.content.query({
		start: 0,
		count: 20, // TODO: Make this a setting in the content type!
		query: query,
		//query: '_path LIKE "/content' + folderPath + '/*" AND (language = "" OR language LIKE "' + content.data.language + '*")',
		sort: searchDate + ' DESC, createdTime DESC',
		contentTypes: [
			content.data.contenttype // NOTE TO SELF: Don't even think about making RSS support multiple content types, the field mapping would be insane!
		]
	});

//	libs.util.log(result);

	var posts = result.hits;

	// Strip html from the description element
	var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';
	var tagOrComment = new RegExp(
		'<(?:'
		// Comment body.
		+ '!--(?:(?:-*[^->])*--+|-?)'
		// Special "raw text" elements whose content should be elided.
		+ '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
		+ '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
		// Regular name
		+ '|/?[a-z]'
		+ tagBody
		+ ')>',
		'gi');

	function removeTags(html) {
		var oldHtml;
		do {
			oldHtml = html;
			html = html.replace(tagOrComment, '');
		} while (html !== oldHtml);
		return html.replace(/</g, '&lt;');
	}

	var itemData = {};
	var postsLength = posts.length;

	for (var i = 0; i < postsLength; i++) {

		itemData = {
			title: findValueInJson(posts[i], settings.title),
			summary: findValueInJson(posts[i], settings.summary),
			date: findValueInJson(posts[i], settings.date),
			body: findValueInJson(posts[i], settings.body)
		};
/*
		log.info("*** Read settings ***");
		libs.util.log(itemData);
*/
		// TODO: Handle no/missing data? Just send empty?

		posts[i].data.description = removeTags(itemData.summary + '');

		// Adding config for timezone on datetime after contents are already created will stop content from being editable in XP 6.4
		// So we need to do it the hacky way
		// TODO: Handle with and without timezone much better!
		var publishDate = itemData.date;
		if (publishDate) {
			publishDate += ':08.965Z';
		}
		posts[i].data.datePublished = itemData.date;


		// TODO: Not in use ... should be setting to add or not?
		//posts[i].data.post = itemData.body;

		// TODO: Fallback to master settings for updatePeriod if not overwritten
		// TODO: Fallback to master settings for updateFrequency if not overwritten
	}

	var params = {
		content: content,
		posts: posts,
		pageUrl: pageUrl,
		site: site
	};

	// Render
	var body = libs.xslt.render(view, params);
	return {
		contentType: 'text/xml',
		body: body
	};
};
