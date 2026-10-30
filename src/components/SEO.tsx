
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  noindex?: boolean;
  ogImage?: string;
  plain?: boolean;
}

const SEO: React.FC<SEOProps> = ({ title, description, noindex = false, ogImage, plain = false }) => {
  const fullTitle = plain ? title : `${title} | Admin - Hillsong Lounge`;
  const canonicalUrl = `${window.location.origin}${window.location.pathname}`;

  useEffect(() => {
    document.title = fullTitle;
  }, [fullTitle]);
  const defaultOgImage = '/brand/d8797de3-f66c-4df1-be7a-6f33464353d3.png';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage || defaultOgImage} />
      <meta property="og:site_name" content="Hillsong Church - Admin Panel" />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@hillsongchurch" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage || defaultOgImage} />
    </Helmet>
  );
};

export default SEO;
