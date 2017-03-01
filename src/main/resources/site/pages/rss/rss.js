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

				try {
					if (eval(jsonPath)) {
						value = eval(jsonPath);
						break; // Expect the first property in the string to be the most important one to use
					}
				} catch (e){
					log.error((e.cause ? e.cause.message : e.message));
				}
			}
		}
	}
	return value;
}

exports.get = function(req) {

	var content = libs.portal.getContent();
	var site = libs.portal.getSite();

	content.data.language = content.data.language || 'en-US';

	// Find the settings for our RSS
	var settings = {
		title: commaStringToArray(content.data.mapTitle) || ['data.title','displayName'],
		summary: commaStringToArray(content.data.mapSummary) || ['data.preface', 'data.intro','data.description','data.summary'],
		thumbnail: commaStringToArray(content.data.mapThumbnail) || ['data.thumbnail', 'data.picture','data.photo'],
		date: commaStringToArray(content.data.mapDate) || ['publish.from','data.publishDate','createdTime'],
		body: commaStringToArray(content.data.mapBody) || ['data.body','data.html','data.text']
	};

	var pageUrl = libs.portal.pageUrl({
		path: content._path
	});

	var folderPath = site._path; // Only allow content from current Site to populate the RSS feed.
	// Exclude certain paths from the search, controlled from admin
	var contentRoot = '/content' + folderPath + '/';
	var query = '_path LIKE "' + contentRoot + '*"';

	// Paths to include
	if ( content.data.include ) {
		content.data.include = libs.util.data.forceArray(content.data.include);
		var includeLength = content.data.include.length;
		for (var i = 0; i < includeLength; i++) {
			query += ' AND _path LIKE "' + contentRoot + content.data.include[i] + '/*"';
		}
	}
	// Paths to skip
	if ( content.data.exclude ) {
		content.data.exclude = libs.util.data.forceArray(content.data.exclude);
		var excludeLength = content.data.exclude.length;
		for (var i = 0; i < excludeLength; i++) {
			query += ' AND _path NOT LIKE "' + contentRoot + content.data.exclude[i] + '/*"';
		}
	}

	// Sort by the date field the app is set up to use
	var searchDate = content.data.mapDate || 'publish.from';
	searchDate = searchDate.replace("[", ".["); // Add dot since we will remove special characters later
	searchDate = searchDate.replace(/['\[\]]/g, ''); // Safeguard against ['xx'] since data path might need it on special characters paths

	var result = libs.content.query({
		start: 0,
		count: 20,
		query: query,
		sort: searchDate + ' DESC, createdTime DESC',
		contentTypes: [
			content.data.contenttype // NOTE TO SELF: Don't even think about making RSS support multiple content types, the field mapping would be insane!
		]
	});

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
			body: findValueInJson(posts[i], settings.body),
			tumbnailId: findValueInJson(posts[i], settings.thumbnail)
		};

		posts[i].data.description = itemData.summary ? removeTags(itemData.summary + '') : "";

		// Adding config for timezone on datetime after contents are already created will stop content from being editable in XP 6.4
		// So we need to do it the hacky way
		var publishDate = itemData.date;
		if (publishDate) {
			publishDate += ':08.965Z';
		}
		posts[i].data.datePublished = itemData.date;

		if(itemData.tumbnailId){
			var thumbnailContent = libs.content.get({
				key: itemData.tumbnailId
			});
			if(thumbnailContent){
				var thumbnailAttachment = thumbnailContent.attachments[thumbnailContent.data.media.attachment];

				posts[i].data.thumbnail = {
					type: thumbnailAttachment.mimeType,
					size: thumbnailAttachment.size,
					url: libs.portal.imageUrl({
						id: itemData.tumbnailId,
						scale: "block(480,270)",
						type: "absolute"
					})
				};
			}
		}

		if(!posts[i].publish){
			posts[i].publish = {
				from: posts[i].createdTime
			}
		}

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
