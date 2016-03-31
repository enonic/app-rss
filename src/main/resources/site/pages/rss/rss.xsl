<?xml version="1.0"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:portal="urn:enonic:xp:portal:1.0"
                xmlns:xs="http://www.w3.org/2001/XMLSchema"
                xmlns:content="http://purl.org/rss/1.0/modules/content/"
                xmlns:dc="http://purl.org/dc/elements/1.1/"
                xmlns:atom="http://www.w3.org/2005/Atom"
                xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
                xmlns:slash="http://purl.org/rss/1.0/modules/slash/"
                exclude-result-prefixes="portal xs">

  <xsl:output method="xml" omit-xml-declaration="no" indent="yes"/>
  <!--<xsl:output method="xml" omit-xml-declaration="no" cdata-section-elements="{http://purl.org/dc/elements/1.1/}creator category description {http://purl.org/rss/1.0/modules/content/}encoded" />-->


  <xsl:variable name="date-format-string" select="'[FNn,*-3], [D01] [MNn,*-3] [Y0001] [H01]:[m01]:[s01]'"/>
  <xsl:variable name="lastBuild" select="/root/posts/item[1]/modifiedTime"/>

  <xsl:template match="/">
    <rss version="2.0">
      <channel>
        <title><xsl:value-of select="/root/site/displayName"/></title>
        <atom:link href="{portal:pageUrl(concat('_path=', root/content/_path), '_type=absolute')}" rel="self" type="application/rss+xml"/>
        <link>
          <xsl:value-of select="portal:pageUrl(concat('_path=', root/content/_path), '_type=absolute')"/>
        </link>
        <description><xsl:value-of select="/root/site/data/description"/></description>
        <lastBuildDate><xsl:value-of select="format-dateTime(xs:dateTime($lastBuild), $date-format-string)"/></lastBuildDate>
        <language>en-US</language>
        <xsl:if test="/root/content/data/updatePeriod and /root/content/data/updateFrequency">
          <sy:updatePeriod><xsl:value-of select="/root/content/data/updatePeriod"/></sy:updatePeriod>
          <sy:updateFrequency><xsl:value-of select="/root/content/data/updateFrequency"/></sy:updateFrequency>
        </xsl:if>
        <generator>Enonic XP</generator>

        <xsl:apply-templates select="/root/posts/item"/>
      </channel>
    </rss>
  </xsl:template>

  <xsl:template match="item">
    <item>
      <title>
        <xsl:value-of select="displayName"/>
      </title>
      <link>
        <xsl:value-of select="portal:pageUrl(concat('_path=', _path), '_type=absolute')"/>
      </link>
      <comments>
        <xsl:value-of select="concat(portal:pageUrl(concat('_path=', _path), '_type=absolute'),'#disqus_thread')"/>
      </comments>

      <pubDate>
        <xsl:value-of select="format-dateTime(xs:dateTime(data/datePublished), $date-format-string)"/>
        <!--<xsl:value-of select="data/datePublished"/>-->
      </pubDate>

      <dc:creator>
        <xsl:text disable-output-escaping="yes">&lt;![CDATA[ </xsl:text><xsl:value-of select="data/authorName"/><xsl:text
          disable-output-escaping="yes"> ]]&gt;</xsl:text>
      </dc:creator>

      <xsl:for-each select="data/tags/item | data/categoryNames/item">
        <category>
          <xsl:text disable-output-escaping="yes">&lt;![CDATA[ </xsl:text><xsl:value-of select="."/><xsl:text disable-output-escaping="yes"> ]]&gt;</xsl:text>
        </category>
      </xsl:for-each>

      <guid isPermaLink="false">
        <xsl:value-of select="portal:pageUrl(concat('_path=', _path), '_type=absolute')"/>
      </guid>

      <description>
        <xsl:text disable-output-escaping="yes">&lt;![CDATA[</xsl:text><xsl:value-of select="data/description"/><xsl:text
          disable-output-escaping="yes">]]&gt;</xsl:text>
      </description>

      <content:encoded>
        <xsl:text disable-output-escaping="yes">&lt;![CDATA[</xsl:text><xsl:value-of select="data/post" disable-output-escaping="yes"/><xsl:text
          disable-output-escaping="yes">]]&gt;</xsl:text>
      </content:encoded>

      <!--<wfw:commentRss></wfw:commentRss>-->
<!--
      <slash:comments>
        <xsl:value-of select="data/numComments"/>
      </slash:comments>
-->
    </item>
  </xsl:template>

</xsl:stylesheet>
