var libs = {
	portal: require('/lib/xp/portal'),
	content: require('/lib/xp/content'),
	xslt: require('/lib/xp/xslt'),
	util: require('/lib/enonic/util')
};

exports.get = function(req) {

    var content = libs.portal.getContent();
    var site = libs.portal.getSite();
    //var folderPath = util.postsFolder();
	 var folderPath = site._path;

    var pageUrl = libs.portal.pageUrl({
        path: content._path
    });

    var result = libs.content.query({
        start: 0,
        count: 20,
        query: '_parentPath="/content' + folderPath + '"',
        sort: 'data.datePublished DESC, createdTime DESC',
        contentTypes: [
            app.name + ':post'
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


    for (var i = 0; i < posts.length; i++) {
        var author = libs.util.content.get(posts[i].data.author);
        posts[i].data.authorName = author.data.name;
        posts[i].data.tags = libs.util.data.forceArray(posts[i].data.tags);

        posts[i].data.category = libs.util.data.forceArray(posts[i].data.category);
        posts[i].data.categoryNames = [];
        posts[i].data.description = removeTags(posts[i].data.preface + ''); // .post earlier, before introducing preface field

			// Adding config for timezone on datetime after contents are already created will stop content from being editable in XP 6.4
			// So we need to do it the hacky way
			var publishDate = posts[i].data.datePublished;
			if (publishDate) {
				publishDate += ':08.965Z';
			}
        posts[i].data.datePublished = publishDate || posts[i].createdTime;

        if (posts[i].data.category) {
            for (var j = 0; j < posts[i].data.category.length; j++) {
                posts[i].data.categoryNames.push(libs.util.content.getProperty(posts[i].data.category[j], 'displayName'));
            }
        }
/*
        var comments = libs.content.query({
            start: 0,
            count: 1000,
            query: "data.post = '" + posts[i]._id + "'",
            sort: 'createdTime DESC',
            contentTypes: [
                app.name + ':comment'
            ]
        });
*/
//        posts[i].data.numComments = comments.total;

    }

    var params = {
        content: content,
        posts: posts,
        pageUrl: pageUrl,
        site: site
    };

    var view = resolve('rss.xsl');
    //var copy = resolve('copy-of.xsl');

    var body = libs.xslt.render(view, params);

    return {
        contentType: 'text/xml',
        body: body
    };
};
