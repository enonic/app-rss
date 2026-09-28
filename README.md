# RSS app

This Enonic XP application adds RSS capabilities to your [Enonic XP](https://github.com/enonic/xp) site. With it you can create RSS feeds (as content) and map them to any Content Type (so you can have multiple feeds).

The App adds:

- one content type (RSS-feed)
- one page controller (creates the XML)
- a filter to insert RSS meta data
- **page template must be created manually after installation!**

## Installation

Head to the [Enonic Market](https://market.enonic.com/vendors/enonic/com.enonic.app.rss) and read all about how to install this app. You have multiple choices.

## How to use this app

After installing the app on your XP server, this is how you set it up to use it.

1. Add App to any site
2. Create a new Page Template in Content Studio
3. Select RSS page controller for the new template
4. Select "RSS feed" content type in "Supports" field for the new template
5. Create a new content of type "RSS Feed"
6. Configure this content to map the content type you want to fetch
7. Done

### Page Template

First you must create a Page Template supporting the new RSS content type and use the bundled page controller "RSS Page". After that you're good to go. Time to create our first feed!

### Feed configuration - Important!

Configuring this app is somewhat tricky the first time as it is powerful and dynamic enough to let you list any type of content inside your RSS-feeds. But read this carefully when setting up your first RSS.

#### Content type

Select from the list of all content types which one to use in this feed. We cannot filter this list so it shows every installed content type for all sites and apps.

#### Paths

Add any path you want to specifically include (omit all the rest) or exclude. The paths are automatically prepended with the base path for the current site, with any child of it also included/excluded automatically. The search string in the back is built up like this: `$site/[YOUR_SETTING]/*`

Just use the "Add" button to create multiple paths to include/exclude.

#### Fields

To make this all work you must map any fields from the content type you want a feed for. We need you to map the fields for title, description, publish date, and body. Version 0.10 of this app doesn't output body.

We use a waterfall technique on fields to use so that if you use the most common field names in your content type then you don't need to set anything up. These are the automatic mappings, from left to right, that the app automatically checks for. If not in this list, add it as a string (like `data.name` or `data['publish-date']`) to map to your fields (it maps to the results.hits[i] json path from a query-search).

**Title**: [Your setting], `data.title`, `displayName`  
**Thumbnail**: [Your setting], `data.thumbnail`, `data.picture`, `data.photo`  
**Description/excerpt**: [Your setting], `data.preface`, `data.description`, `data.summary`  
**Author**: [Your setting], `data.author`, content creator displayName  
**Categories**: [Your setting], `data.category`, `data.categories`, `data.tags`  
**Publish date**: [Your setting], `data.publishDate`, `createdTime`  
**Timezone**: [Your setting], `Etc/UTC`  
**Full body**: [Your setting], `'data.body', 'data.html', 'data.text'`

- Remember to start with `data.` when mapping custom fields from your content type.
- If your field name contains special characters, like `-`, then wrap the name correctly: `data['My-super-field!']`

**Author** and **category** mapping is "smart". It will handle mapped fields just containing strings (as-is), but it will also handle related content (extracting their displayName value). In addition, the author data will handle being sent a specific user (like with the content `creator` data) if the format is something like `user:system:su` and then extract that user's name.


## Known issues

- RSS feed's settings for RSS "SY" is not used.
- App's default settings for RSS "SY" is not used.
- If no description found for feed item, it will be empty.
- Setting for TimeZone on each RSS content is temporary, it will be removed/replaced.
