
const contentLib =  require('/lib/xp/content');
const portalLib = require('/lib/xp/portal');
const util = require('/lib/util');
const authLib = require('/lib/xp/auth');
const arrays = require('/lib/arrays');
const json = require('/lib/json');
const string = require('/lib/string');

const DEFAULT_FEED_COUNT = 20;
const DEFAULT_FEED_LANG = 'no-NO';

exports.getParamsFromMultiContentType = function(site, content){

  if (content.type != app.name + ":rss-page-multi-content") {
    return {}
  }

  const rssFeed = {
    title: content.displayName,
    description: site.data.description,
    counter: content.data.counter || DEFAULT_FEED_COUNT,
    language: content.data.language || DEFAULT_FEED_LANG,
    url: portalLib.pageUrl({
      path: content._path,
      type: 'absolute'
    })
  };

  const contentTypeMappings = content.data.mappings.reduce((acc, mapping) => {
    acc[mapping.contenttype] = {
      title: arrays.commaStringToArray(mapping.mapTitle) || ['data.title', 'displayName'],
      summary: arrays.commaStringToArray(mapping.mapSummary) || ['data.preface', 'data.intro', 'data.description', 'data.summary'],
      author: arrays.commaStringToArray(mapping.mapAuthor) || ['data.author', 'creator'],
      thumbnail: arrays.commaStringToArray(mapping.mapThumbnail) || ['data.thumbnail', 'data.picture', 'data.photo'],
      date: arrays.commaStringToArray(mapping.mapDate) || ['publish.from', 'data.publishDate', 'createdTime'],
      body: arrays.commaStringToArray(mapping.mapBody) || ['data.body', 'data.html', 'data.text'],
      categories: arrays.commaStringToArray(mapping.mapCategories) || ['data.category', 'data.categories', 'data.tags'],
      timeZone: mapping.timezone || "Etc/UCT",
      thumbnailScale: mapping.mapThumbnailScale || "block(480,270)"
    }
    return acc
  },{})

  const rssContent = queryContent(site, content)
  const simpleRssContent = util.data.forceArray(rssContent.hits).map((hit) => {
    return getSimpleRssItem(contentTypeMappings[hit.type], hit)
  })

  return {
    feed: rssFeed,
    items: simpleRssContent,
  }
}

function getSimpleRssItem(settings, content){

  const author = json.findValueInJson(content, settings.author)
  const authorName = getContentAuthorName(author)
  const rawCategories = json.findValueInJson(content, settings.categories)
  const categories = getCategories(util.data.forceArray(rawCategories))
  const rawSummary = json.findValueInJson(content, settings.summary)
  return {
    title: json.findValueInJson(content, settings.title),
    summary: rawSummary ? string.removeTags(rawSummary + '') : "",
    date: json.findValueInJson(content, settings.date),
    body: json.findValueInJson(content, settings.body),
    authorName,
    thumbnailId: json.findValueInJson(content, settings.thumbnail),
    categories,
  };
}

function getContentAuthorName(author){
  // Content creator is the only user we can find, lookup username
  if (/^(user:.*)$/.test(author)) {
    const userCreator = authLib.getPrincipal(author);
    if (userCreator) {
      return userCreator.displayName;
    }
  } else {
    // Author is mapped to another content, lookup
    if (/^(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})$/.test(author)) {
      const authorContent = contentLib.get({
        key: author
      });
      if (authorContent) {
        return authorContent.displayName;
      }
    }
  }
}

function getCategories(categories){
  return categories.map((category) => {
    if (typeof category === "string") {
      if (/^(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})$/.test(category)) {
        const categoryContent = contentLib.get({
          key: category
        });
        if (categoryContent) {
          return categoryContent.displayName;
        }
      } else if (category.trim() != "") {
        return category
      }
    }
  });
}

function queryContent(site, content){

  // Setup for path filtering
  const contentRoot = '/content' + site._path + '/';
  let queryString = '_path LIKE "' + contentRoot + '*"';

  // Content paths to include
  if (content.data.include) {
    content.data.include = util.data.forceArray(content.data.include);
    const includeLength = content.data.include.length;
    for (let i = 0; i < includeLength; i++) {
      queryString += (i == 0) ? ' AND' : ' OR';
      queryString += ' _path LIKE "' + contentRoot + content.data.include[i] + '/*"';
    }
  }
  // Content paths to exclude
  if (content.data.exclude) {
    content.data.exclude = util.data.forceArray(content.data.exclude);
    const excludeLength = content.data.exclude.length;
    for (let i = 0; i < excludeLength; i++) {
      queryString += ' AND _path NOT LIKE "' + contentRoot + content.data.exclude[i] + '/*"';
    }
  }
  // Filter on tags
  if(content.data.types) {
    const tags = util.data.forceArray(content.data.types)
    for (let i = 0; i< tags.length; i++){
      queryString += ' AND data.types = "' + tags[i] + '"'
    }
  }
  // Sort by the date field the app is set up to use
  let searchDate = content.data.mapDate || 'publish.from';
  searchDate = searchDate.replace("[", ".["); // Add dot since we will remove special characters later
  searchDate = searchDate.replace(/['\[\]]/g, ''); // Safeguard against ['xx'] since data path might need it on special characters paths
  const contentTypes = util.data.forceArray(content.data.mappings).map((map) => {
    return map.contenttype
  })

  log.info('searchDate %s', JSON.stringify(searchDate, null, 2))
  log.info('queryString %s', JSON.stringify(queryString, null, 2))

  log.info('contentTypes, %s', JSON.stringify(contentTypes, null, 2))
  // Fetch our feed items!
  return contentLib.query({
    start: 0,
    count: content.data.counter || DEFAULT_FEED_COUNT,
    query: queryString,
    sort: searchDate + ' DESC, createdTime DESC',
    contentTypes
  });
}
