import React from 'react';
import Giscus from '@giscus/react';
import { useColorMode } from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function GiscusComponent() {
  const { colorMode } = useColorMode();
  const { i18n } = useDocusaurusContext();

  return (
    <div style={{ marginTop: '2rem' }}>
      <Giscus
        repo="The-Untitled-Org/wasla-genie"
        repoId="R_kgDOSfUBJQ"
        category="Blog"
        categoryId="DIC_kwDOSfUBJc4C-O6p"
        mapping="title"
        term="Welcome to @giscus/react component!"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={colorMode === 'dark' ? 'transparent_dark' : 'light'}
        lang={i18n.currentLocale}
        loading="lazy"
      />
    </div>
  );
}
