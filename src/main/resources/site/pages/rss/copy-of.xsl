<?xml version="1.0"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                exclude-result-prefixes="#all">

	<xsl:output method="xml" omit-xml-declaration="no"/>

	<xsl:template match="/">
		<xsl:copy-of select="/"/>
	</xsl:template>

</xsl:stylesheet>
