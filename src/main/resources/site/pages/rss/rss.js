var libs = {
	content: require('/lib/xp/content'),
	portal: require('/lib/xp/portal'),
	xslt: require('/lib/xp/xslt'),
	util: require('/lib/enonic/util')
};

/*
function commaStringToArray(str) {
	var commas = str || '';
	var arr = commas.split(',');
	if (arr) {
		arr.map(function(s) { return s.trim() });
	}
	return arr;
}
*/
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

exports.get = function(req) {

	var content = libs.portal.getContent();
	var site = libs.portal.getSite();

	// Find any settings for
	var settings = {
		title: content.data.mapTitle || ['title','displayName'],
		summary: content.data.mapSummary || ['preface','description','summary'],
		date: content.data.mapDate || ['publishDate','createdTime'],
		body: content.data.mapBody || ['body','html','text']
	};

	libs.util.log(settings);

	 var folderPath = site._path; // Only allow content from current Site to populate the RSS feed.

    var pageUrl = libs.portal.pageUrl({
        path: content._path
    });

    var result = libs.content.query({
        start: 0,
        count: 20,
		  query: '_path LIKE "/content' + folderPath + '/*"',
        sort: 'createdTime DESC',
        contentTypes: [
            content.data.contenttype
        ]
    });

//	 libs.util.log(result);

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

	for (var i = 0; i < posts.length; i++) {
//        var author = libs.util.content.get(posts[i].data.author);
//        posts[i].data.authorName = author.data.name;
//        posts[i].data.tags = libs.util.data.forceArray(posts[i].data.tags);
//        posts[i].data.category = libs.util.data.forceArray(posts[i].data.category);
//        posts[i].data.categoryNames = [];

		settings.title = findValueInJson(settings.title);
		settings.summary = findValueInJson(settings.summary);
		settings.date = findValueInJson(settings.date);
		settings.body = findValueInJson(settings.body);

		// TODO: Collect json data from content data ... how?
		// TODO: Store this data in the object sent back to the XML
		// TODO: Handle no/missing data? Just sent empty?

		posts[i].data.description = removeTags(posts[i].data.preface + ''); // .post earlier, before introducing preface field

		// TODO: Handle with and without timezone in this field!

		// Adding config for timezone on datetime after contents are already created will stop content from being editable in XP 6.4
		// So we need to do it the hacky way
		var publishDate = posts[i].data.datePublished;
		if (publishDate) {
			publishDate += ':08.965Z';
		}
		posts[i].data.datePublished = publishDate || posts[i].createdTime;
/*
        if (posts[i].data.category) {
            for (var j = 0; j < posts[i].data.category.length; j++) {
                posts[i].data.categoryNames.push(libs.util.content.getProperty(posts[i].data.category[j], 'displayName'));
            }
        }
*/
		// TODO: Fallback to master settings for updatePeriod if not overwritten
		// TODO: Fallback to master settings for updateFrequency if not overwritten
	}


    var params = {
        content: content,
        posts: posts,
        pageUrl: pageUrl,
        site: site
    };

    var view = resolve('rss.xsl');

    var body = libs.xslt.render(view, params);

    return {
        contentType: 'text/xml',
        body: body
    };
};
