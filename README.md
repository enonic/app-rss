# RSS app for Enonic XP version 6

This Enonic XP application adds RSS capabilities to your [Enonic XP](https://github.com/enonic/xp) site.

The App adds one content type and one page controller for this to work.

## Building and deploying
<!--
There are two options. One is to simply download the app [JAR file](http://repo.enonic.com/public/com/enonic/app/rss/1.0.0/rss-1.0.0.jar) and move it to the XP installation's `$XP_HOME/deploy` folder.
-->
Or you can build this app with gradle. First, download the zip file of this repo. Unpack it locally. In the terminal, from the root of the project, type `./gradlew build`. On Windows, just type `gradlew build`. Next, move the JAR file from `build/libs` to your `$XP_HOME/deploy` directory. This app will now be available to add to your websites through the Content Studio admin tool in Enonic XP.

If you are upgrading to a newer version of this app, make sure to remove the old version's JAR file from the `$XP_HOME/deploy` directory.

## How to use this app

1. Add App to any site
2. Create a Page Template using the new RSS page controller, supporting new RSS content type
3. Create a content of type RSS
4. Configure this content to map the content type you want to fetch
5. Done, just add a link to this RSS content in a good place

## Releases and Compatibility

| Version        | XP version |
| ------------- | ------------- |
| 1.0.0-SNAPSHOT | 6.5.0 |

## Changelog

### Version 1.0.0-SNAPSHOT

* Work in progress
* Basic support, missing tweaks and minor functionality
