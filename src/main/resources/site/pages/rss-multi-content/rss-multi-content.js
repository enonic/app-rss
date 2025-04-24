const portalLib = require('/lib/xp/portal');
const rssXmlLib = require("/lib/rss-xml");

exports.get = function() {
  return rssXmlLib.renderMultiContentType(portalLib.getSite(), portalLib.getContent());
};
