const portalLib = require('/lib/xp/portal');
const contentLib = require('/lib/xp/content');
const rssXmlLib = require('/lib/rss-xml');

exports.get = function(req) {
    const params = req.params;

    if (params.method === 'list') {
        const results = contentLib.query({ contentTypes: [`${app.name}:rss-page`] });

        const body = results.hits.map(hit => {
            const site = contentLib.getSite({ key: hit._id });

            return { 
                id: hit._id,
                path: hit._path.replace(site._path + '/', ''),
                displayName: hit.displayName,
            }
        });

        return { body, contentType: 'application/json' }; 
    }

    if (params.method === 'xml' && params.id) {
        const content = contentLib.get({ key: params.id });
        const site = contentLib.getSite({ key: params.id });

        if (!content) {
            return { body: { message: 'Could not get content with provided id.' }, contentType: 'application/json' }
        }

        return rssXmlLib.renderXmlOnly(site, content);
    }

    return { status: 400 }; 
};

