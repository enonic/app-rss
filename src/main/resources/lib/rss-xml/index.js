var libs = {
	content: require('/lib/xp/content'),
	portal: require('/lib/xp/portal'),
	auth: require('/lib/xp/auth'),
    xslt: require('/lib/xslt'),
    util: require('/lib/util'),
    thymeleaf: require('/lib/thymeleaf'),
	moment: require("/lib/moment-timezone")
};

function render(site, content) {
	const params = getParams(site, content);

	return !isParamsValid(params) ? renderInvalidContentWarning() : renderXml(params);
};

function renderXmlOnly(site, content) {
	const params = getParams(site, content);

	return !isParamsValid(params) ? renderEmptyXml() : renderXml(params);
}

function getParams(site, content) {
	// Don't run RSS rendering if not used on a RSS content
	if (content.type != app.name + ":rss-page") {
		return {}
	}

	var rssFeed = {}; // General info about the feed
	rssFeed.title = content.displayName;
	rssFeed.description = site.data.description;
	rssFeed.counter = content.data.counter || 20;
	rssFeed.language = content.data.language || 'en-US';
	rssFeed.url = libs.portal.pageUrl({
		path: content._path,
		type: 'absolute'
	});

	// Find the settings for our RSS
	var settings = {
		title: commaStringToArray(content.data.mapTitle) || ['data.title', 'displayName'],
		summary: commaStringToArray(content.data.mapSummary) || ['data.preface', 'data.intro', 'data.description', 'data.summary'],
		author: commaStringToArray(content.data.mapAuthor) || ['data.author', 'creator'],
		thumbnail: commaStringToArray(content.data.mapThumbnail) || ['data.thumbnail', 'data.picture', 'data.photo'],
		date: commaStringToArray(content.data.mapDate) || ['publish.from', 'data.publishDate', 'createdTime'],
		body: commaStringToArray(content.data.mapBody) || ['data.body', 'data.html', 'data.text'],
		categories: commaStringToArray(content.data.mapCategories) || ['data.category', 'data.categories', 'data.tags'],
		timeZone: content.data.timezone || "Etc/UCT",
		thumbnailScale: content.data.mapThumbnailScale || "block(480,270)"
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
			query += (i == 0) ? ' AND' : ' OR';
			query += ' _path LIKE "' + contentRoot + content.data.include[i] + '/*"';
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

	// Fetch our feed items!
	var result = libs.content.query({
		start: 0,
		count: rssFeed.counter,
		query: query,
		sort: searchDate + ' DESC, createdTime DESC',
		contentTypes: [
			content.data.contenttype // NOTE TO SELF: Don't even think about making RSS support multiple content types, the field mapping would be insane!
		]
	});
	var posts = result.hits;
	var postsLength = posts.length;
	var feedItems = [];

	// Set last build for the feed equal to the top article result or the rss-page modifiedDate
	var lastBuild = new Date(Math.max.apply(null, posts.map(function(e) {
		return new Date(posts.modifiedTime);
	})));
	rssFeed.lastBuild = feedItems.length > 0 ? lastBuild : libs.moment(content.modifiedTime, 'YYYY-MM-DD[T]HH:mm:ss[.]SSS[Z]').tz(settings.timeZone).format("ddd, DD MMM YYYY HH:mm:ss ZZ");

	for (var i = 0; i < postsLength; i++) {

		var feedItem = {};
		var itemData = {
			title: findValueInJson(posts[i], settings.title),
			summary: findValueInJson(posts[i], settings.summary),
			date: findValueInJson(posts[i], settings.date),
			body: findValueInJson(posts[i], settings.body),
			authorName: findValueInJson(posts[i], settings.author),
			thumbnailId: findValueInJson(posts[i], settings.thumbnail),
			categories: findValueInJson(posts[i], settings.categories)
		};

		// Content creator is the only user we can find, lookup username
		if (/^(user:.*)$/.test(itemData.authorName)) {
			var userCreator = libs.auth.getPrincipal(itemData.authorName);
			if (userCreator) {
				itemData.authorName = userCreator.displayName;
			}
		} else {
			// Author is mapped to another content, lookup
			if (/^(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})$/.test(itemData.authorName)) {
				var authorContent = libs.content.get({
					key: itemData.authorName
				});
				if (authorContent) {
					itemData.authorName = authorContent.displayName;
				}
			}
		}

		// Category handling
		feedItem.categories = [];
		var tmpCategories = libs.util.data.forceArray(itemData.categories);

		if (JSON.stringify(tmpCategories) != "[null]") {
			tmpCategories.forEach( function(category) {
				if (typeof category === "string") {
					if (/^(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})$/.test(category)) {
						var categoryContent = libs.content.get({
							key: category
						});
						if (categoryContent) {
							feedItem.categories.push(categoryContent.displayName);
						}
					} else if (category.trim() != "") {
						feedItem.categories.push(category);
					}
				}
			});
		}
		// Reset categories to null if empty
		if (feedItem.categories.length === 0) {
			feedItem.categories = null;
		}

		feedItem.title = itemData.title || 'Title missing';
		feedItem.modifiedTime = posts[i].modifiedTime;
		feedItem.authorName = itemData.authorName;
		feedItem.summary = itemData.summary ? removeTags(itemData.summary + '') : "";
		feedItem.link = libs.portal.pageUrl({
			path: posts[i]._path,
			type: 'absolute'
		});

		// Timezone handling and formatting
		var properDate = itemData.date ? itemData.date : posts[i].createdTime;
		properDate = libs.moment(properDate, 'YYYY-MM-DD[T]HH:mm:ss[.]SSS[Z]').tz(settings.timeZone).format("ddd, DD MMM YYYY HH:mm:ss ZZ");
		feedItem.publishDate = properDate;

		// Thumbnails
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
						scale: settings.thumbnailScale,
						type: "absolute"
					})
				};
			}
		}

		// Done, add item to array
		feedItems.push(feedItem);
	}

	return {
		feed: rssFeed,
		items: feedItems
	};
}

module.exports = { render, renderXmlOnly };

// Helper functions

function isParamsValid(params) {
	return params.feed && params.items;
}

function renderInvalidContentWarning() {
	const message = "Invalid Content Type!<br /><br />You need to create a new content of type \"RSS Page\" and configure it, in order to see the RSS Feed."

	return {
		contentType: 'text/html',
		body: libs.thymeleaf.render( resolve('invalid-content.html'), { message })
	};
}

function renderEmptyXml() {
	return {
		contentType: 'application/xml',
		body: libs.xslt.render(resolve('empty-xml.xsl'), {})
	};
}

function renderXml(params) {
	var body = "";

	try {
		body = libs.xslt.render(resolve('rss.xsl'), params);
	} catch (e) {
		e.printStackTrace()
	}

	return {
		contentType: 'text/xml',
		body: body
	};
}

function commaStringToArray(str) {
	if ( !str || str == '' || str == null) return null;
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
					if (typeof value === "string") {
						if (value.trim() === "")
							value = null; // Reset value if empty string (skip empties)
						else
							return value; // Expect the first property in the string is the most important one to use
					} else if(Array.isArray(value)){
						return value;
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
