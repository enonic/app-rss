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
	arr = libs.util.data.forceArray(str); // Make sure we always work with an array
	if (arr) {
		arr.map(function(s) { return s.trim() });
	}
	//libs.util.log(arr);
	return arr;
}

function findValueInJson(json, paths) {
	var value = null;
	var pathLength = paths.length;
	var jsonPath = "";

	for (var i = 0; i < pathLength; i++) {
		if ( paths[i] ) {
			jsonPath = 'json.' + paths[i] + '';
			try {
				if ( eval(jsonPath) ) {
					value = eval(jsonPath);
					//log.info(jsonPath);
					//log.info(value);
					if (value) {
						if (value.trim() === "")
							value = null; // Reset value if empty string (skip empties)
						else
							return value; // Expect the first property in the string is the most important one to use
					} else {
						return null;
					}
				}
			} catch (e) {
				log.error((e.cause ? e.cause.message : e.message));
			}
		}
	}
	return value;
}

// Strip html from the description element
function removeTags(html) {
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
	var oldHtml;
	do {
		oldHtml = html;
		html = html.replace(tagOrComment, '');
	} while (html !== oldHtml);
	return html.replace(/</g, '&lt;');
}

exports.get = function(req) {

	var site = libs.portal.getSite();
	var content = libs.portal.getContent();

	if(content.type != app.name+":rss-page"){
		var timestamp = Date.now();
		var view = resolve('invalid-content.html');

		var params = {
			assetsUri: libs.portal.url({path: "/admin/assets/" + timestamp}),
			message: "Invalid Content Type. <br /> You need to create a RSS Page and configure it in order to see the RSS Feed XML"
		};

		return {
			contentType: 'text/html',
			body: libs.thymeleaf.render(view, params)
		};
	} else {
		var rssFeed = {}; // General info about the feed

		rssFeed.title = content.displayName;
		rssFeed.description = site.data.description;
		rssFeed.language = content.data.language || 'en-US';
		rssFeed.url = libs.portal.pageUrl({
			path: content._path,
			type: 'absolute'
		});

		// Find the settings for our RSS
		var settings = {
			title: commaStringToArray(content.data.mapTitle) || ['data.title', 'displayName'],
			summary: commaStringToArray(content.data.mapSummary) || ['data.preface', 'data.intro', 'data.description', 'data.summary'],
			thumbnail: commaStringToArray(content.data.mapThumbnail) || ['data.thumbnail', 'data.picture', 'data.photo'],
			date: commaStringToArray(content.data.mapDate) || ['publish.from', 'data.publishDate', 'createdTime'],
			body: commaStringToArray(content.data.mapBody) || ['data.body', 'data.html', 'data.text']
		};

		// Setup for path filtering
		var folderPath = site._path; // Only allow content from current Site to populate the RSS feed.
		var contentRoot = '/content' + folderPath + '/';
		var query = '_path LIKE "' + contentRoot + '*"';

		// Content paths to include
		if (content.data.include) {
			content.data.include = libs.util.data.forceArray(content.data.include);
			var includeLength = content.data.include.length;
			for (var i = 0; i < includeLength; i++) {
				query += ' AND _path LIKE "' + contentRoot + content.data.include[i] + '/*"';
			}
		}
		// Content paths to exclude
		if (content.data.exclude) {
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

		var postsLength = posts.length;
		var feedItems = [];

		for (var i = 0; i < postsLength; i++) {
			var feedItem = {};
			var itemData = {
				title: findValueInJson(posts[i], settings.title),
				summary: findValueInJson(posts[i], settings.summary),
				date: findValueInJson(posts[i], settings.date),
				body: findValueInJson(posts[i], settings.body),
				thumbnailId: findValueInJson(posts[i], settings.thumbnail)
			};

			feedItem.title = itemData.title || 'Title missing';
			feedItem.modifiedTime = posts[i].modifiedTime;
			feedItem.summary = itemData.summary ? removeTags(itemData.summary + '') : "";
			feedItem.link = libs.portal.pageUrl({
				path: posts[i]._path,
				type: 'absolute'
			});

			// Adding config for timezone on datetime after contents are already created will stop content from being editable in XP 6.4
			// So we need to do it the hacky way
			feedItem.publishDate = itemData.date ? (itemData.date.indexOf("Z") != -1 ? itemData.date : itemData.date + ':08.965Z') : posts[i].createdTime;

			if (itemData.thumbnailId) {
				var thumbnailContent = libs.content.get({
					key: itemData.thumbnailId
				});
				if (thumbnailContent) {
					var thumbnailAttachment = thumbnailContent.attachments[thumbnailContent.data.media.attachment];

					feedItem.thumbnail = {
						type: thumbnailAttachment.mimeType,
						size: thumbnailAttachment.size,
						url: libs.portal.imageUrl({
							id: itemData.thumbnailId,
							scale: "block(480,270)",
							type: "absolute"
						})
					};
				}
			}

			// Done, add item to array
			feedItems.push(feedItem);
		}

		var params = {
			feed: rssFeed,
			items: feedItems
		};

		// Render
		var body = libs.xslt.render(view, params);
		return {
			contentType: 'text/xml',
			body: body
		};
	}
};
