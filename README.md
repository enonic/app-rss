# RSS app

**Beta software!**

This Enonic XP 6 application adds RSS capabilities to your [Enonic XP](https://github.com/enonic/xp) site. With this app installed on a site you have the ability to create RSS feeds (as content) and map them to any Content Type.

The App adds:
* one content type (RSS-feed)
* one page controller (creates the XML)
* a filter to insert RSS meta data

## Building and deploying

There are three options. One is to simply download the app [JAR file](http://repo.enonic.com/public/com/enonic/app/rss/0.10.1/rss-0.10.1.jar) and move it to the XP installation's `$XP_HOME/deploy` folder.

Or you can build this app with gradle. First, download the zip file of this repo. Unpack it locally. In the terminal, from the root of the project, type `./gradlew build`. On Windows, just type `gradlew build`. Next, move the JAR file from `build/libs` to your `$XP_HOME/deploy` directory. This app will now be available to add to your websites through the Content Studio admin tool in Enonic XP.

If you are upgrading to a newer version of this app, make sure to remove the old version's JAR file from the `$XP_HOME/deploy` directory.

Last option is to just visit the Enonic Market in the Application admin tool and install it!

## How to use this app

1. Add App to any site
2. Create a Page Template using the new RSS page controller, supporting new RSS content type
3. Create a content of type RSS
4. Configure this content to map the content type you want to fetch
5. Done, just add a link to this RSS content in a good place

### Page Template

First you must create a Page Template supporting the new RSS content type and use the bundled page controller "RSS Page". After that you're good to go. Time to create our first feed!

### Feed configuration - Important!

Configuring this app is somewhat tricky the first time as it is powerful and dynamic enough to let you list any type of content inside your RSS-feeds. But read this carefully when setting up your first RSS.

#### Content type

Select from the list of all content types which one to use in this feed. We cannot filter this list so it shows every installed content type for all sites and apps.

#### Paths

Add any path you want to specifically include (omit all the rest) or exclude. The paths are automatically prepended with the base path for the current site, with any childs of it also included/excluded automatically. The search string in the back is built up like this: `$site/[YOUR_SETTING]/*`

Just use the "Add" button to create multiple paths to include/exclude.

#### Fields

To make this all work you must map any fields from the content type you want a feed for. We need you to map the fields for title, description, publish date, and body. Version 0.10 of this app doesn't output body.

We use a waterfall technique on fields to use so that if you use the most common field names in your content type then you don't need to set anything up. These are the automatic mappings, from left to right, that the app automatically checks for. If not in this list, add it as a string (like `data.name` or `data['publish-date']`) to map to your fields (it maps to the results.hits[i] json path from a query-search).

**Title**: [Your setting], `data.title`, `displayName`  
**Description**: [Your setting], `data.preface`, `data.description`, `data.summary`  
**Publish date**: [Your setting], `data.publishDate`, `createdTime`  
**Full body**: [Your setting], `data.body`, `data.html`, `data.text`  

* Remember to start with `data.` when mapping custom fields from your content type.
* If your field name contains special characters, like `-`, then wrap the name correctly: `data.['My-super-field!']`

## Disclaimer

App is not fully done yet. It works, but some extra features is needed, as well as increased usability. Consider it a beta.

## Known issues

* DateTime fields using timezone can not be mapped
* Settings for RSS "SY" is not used
* "Full body" setting is not used, nor displayed in RSS feeds

## Releases and Compatibility

| Version        | XP version |
| ------------- | ------------- |
| 0.10.2 | 6.7.3 |
| 0.10.1 | 6.5.0 |
| 0.10.0 | 6.5.0 |
| 0.9.0 | 6.5.0 |

## Changelog

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
