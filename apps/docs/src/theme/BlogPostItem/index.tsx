import React, { useEffect, useState } from 'react';
import Giscus from '@giscus/react';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import BlogPostItem from '@theme-original/BlogPostItem';
import type BlogPostItemType from '@theme/BlogPostItem';
import type { WrapperProps } from '@docusaurus/types';

type Props = WrapperProps<typeof BlogPostItemType>;

function GiscusComments(): React.ReactNode {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
    const observer = new MutationObserver(updateTheme);

    updateTheme();
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="margin-vert--lg">
      <Giscus
        repo="The-Untitled-Org/wasla"
        repoId="R_kgDOSfUBJQ"
        category="Blog"
        categoryId="DIC_kwDOSfUBJc4C-O6p"
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={theme}
        lang="en"
        loading="lazy"
      />
    </div>
  );
}

export default function BlogPostItemWrapper(props: Props): React.ReactNode {
  const { isBlogPostPage } = useBlogPost();

  return (
    <>
      <BlogPostItem {...props} />
      {isBlogPostPage ? <GiscusComments /> : null}
    </>
  );
}
