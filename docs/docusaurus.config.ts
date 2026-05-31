import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Wasla',
  tagline: 'Universal synchronization layer for AI agent orchestrators',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://The-Untitled-Org.github.io',
  baseUrl: '/wasla/',

  organizationName: 'The-Untitled-Org',
  projectName: 'wasla',
  deploymentBranch: 'gh-pages',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/The-Untitled-Org/wasla/tree/main/docs/',
          routeBasePath: '/',
        },
        blog: {
          path: './blog',
          routeBasePath: '/blog',
          authorsMapPath: 'authors.yml',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.png',
    colorMode: {
      respectPrefersColorScheme: false,
      defaultMode: 'light',
      disableSwitch: false,
    },
    navbar: {
      title: 'Wasla',
      logo: {
        alt: 'Wasla Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/blog',
          label: 'Blog',
          position: 'left',
        },
        {
          to: '/team',
          label: 'Team',
          position: 'right',
        },
        {
          to: '/contributing',
          label: 'Contributing',
          position: 'right',
        },
        {
          href: 'https://github.com/The-Untitled-Org/wasla',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Project Spec',
              to: '/specs/project-spec',
            },
            {
              label: 'Design Discussion',
              to: '/discussions/ai-discussions',
            },
            {
              label: 'Meetings of Mind',
              to: '/discussions/MoM',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Organization',
              href: 'https://github.com/The-Untitled-Org',
            },
            {
              label: 'Contributors',
              href: 'https://github.com/The-Untitled-Org/wasla/graphs/contributors',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Repository',
              href: 'https://github.com/The-Untitled-Org/wasla',
            },
            {
              label: 'Issues',
              href: 'https://github.com/The-Untitled-Org/wasla/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} The Untitled Org. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
