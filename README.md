# RSS app

**Beta software!**

This Enonic XP 6 application adds RSS capabilities to your [Enonic XP](https://github.com/enonic/xp) site. With it you can create RSS feeds (as content) and map them to any Content Type (so you can have multiple feeds).

The App adds:
* one content type (RSS-feed)
* one page controller (creates the XML)
* a filter to insert RSS meta data
* **page template must be created manually after installation!**

## Installation

Head to the [Enonic Market](https://market.enonic.com/vendors/enonic/com.enonic.app.rss) and read all about how to install this app. You have multiple choices.

## How to use this app

After installing the app on your XP server, this is how you set it up to use it.

1. Add App to any site
2. Create a Page Template using the new RSS page controller (support: this app's RSS content type)
3. Create a new content of type RSS
4. Configure this content to map the content type you want to fetch
5. Done

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
**Full body**: BETA - not used!

* Remember to start with `data.` when mapping custom fields from your content type.
* If your field name contains special characters, like `-`, then wrap the name correctly: `data['My-super-field!']`

**Author** and **category** mapping is "smart". It will handle mapped fields just containing strings (as-is), but it will also handle related content (extracting their displayName value). In addition, the author data will handle being sent a specific user (like with the content `creator` data) if the format is something like `user:system:su` and then extract that user's name.

## Disclaimer

App is still in *BETA*! It works, but some much needed features are needed, as well as increased usability, more testing, and minor issues needs fixing. Use it in production at your own risk.

## Known issues

* RSS feed's settings for RSS "SY" is not used.
* App's default settings for RSS "SY" is not used.
* "Full body" setting is not used, nor displayed in RSS feeds.
* If no description found for feed item, it will be empty.
* Setting for TimeZone on each RSS content is temporary, it will be removed/replaced.

## Releases and Compatibility

| Version        | XP version |
| ------------- | ------------- |
| 0.12.0 | 6.9.3 |
| 0.11.0 | 6.9.3 |
| 0.10.2 | 6.7.3 |
| 0.10.1 | 6.5.0 |
| 0.10.0 | 6.5.0 |
| 0.9.0 | 6.5.0 |

## Changelog

### Version 0.12.5

* Fixed bug with unsafe use of data on owner (used as fallback in 0.12.x when no author field defined). If you had deleted a user that owned a content, and used this fallback, the RSS feed would crash.

### Version 0.12.4

* *Don't use 0.12.0, 0.12.1, 0.12.2, or 0.12.3!*
* Fix for date format, was not valid RSS on the timezone part
* Improved code for date and time handling

### Version 0.12.0

* Added support to timezone (using moment.js). For a complete list of time zones that can be used, see:
https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
* Added support for author mapping
* Added support for category mapping
* Added support for controlling number of feed items to generate
* Proper handling of RSS feed title (from content title)
* **Critical**: Fixed a bug that breaks the RSS feed if the Published Date property is a DateTime with timezone
* Fix so that controller does not run if content is not a RSS Page (avoids crash)
* Upgrade to Gradle 3.4
* **Breaking change**: removed the field "title" from RSS content type (using displayName instead).
* **Future breaking change**: added a quickfix setting for TimeZone selection on RSS content. This *will* be removed in next release as there are better ways to solve this.

### Version 0.11.0

* Added support for displaying images for each feed item
* Refactor XML rendering code to more efficient
* Multiple minor fixes/adjustments/cleanups/speedups/refactoring
* Upgrade XP required version to 6.9
* **Breaking change:** now using the built-in setting from XP for "publish date" in RSS feed. If you still depend on old custom fields you must revise your app settings for this field.

### Version 0.10.2

* Upgrade to 6.7.3
* Escape title output in XML

### Version 0.10.1

* Finish readme (config instructions)
* Simplify content type
* Launch beta

### Version 0.10.0

* Add correct meta tags to all page headers (html head) for each RSS feed on current site
* Ability to add include-paths in settings of each RSS to filter search even further

### Version 0.9.0

App works, but work in progress. Missing some tweaks and minor functionality, and documentation.
