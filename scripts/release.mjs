import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const CHANGELOG_PATH = 'CHANGELOG.md';
const PACKAGE_PATH = 'package.json';
const LOCK_PATH = 'package-lock.json';

const sectionOrder = [
  'Added',
  'Fixed',
  'Changed',
  'Documentation',
  'Tests',
  'Build and CI',
  'Chores',
  'Other',
];

const typeSections = new Map([
  ['feat', 'Added'],
  ['fix', 'Fixed'],
  ['perf', 'Changed'],
  ['refactor', 'Changed'],
  ['docs', 'Documentation'],
  ['test', 'Tests'],
  ['ci', 'Build and CI'],
  ['build', 'Build and CI'],
  ['style', 'Chores'],
  ['chore', 'Chores'],
]);

function run(command, args = [], options = {}) {
  const output = execFileSync(command, args, {
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });

  return output?.trim() ?? '';
}

function capture(command, args = []) {
  return run(command, args, { capture: true });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function getTags() {
  const output = capture('git', ['tag', '--list', 'v[0-9]*', '--sort=version:refname']);
  return output ? output.split('\n') : [];
}

function getCommits(range) {
  const output = capture('git', ['log', '--reverse', '--format=%h%x09%s', range]);

  if (!output) {
    return [];
  }

  return output
    .split('\n')
    .map((line) => {
      const [sha, ...titleParts] = line.split('\t');
      return { sha, title: titleParts.join('\t') };
    })
    .filter(({ title }) => !title.startsWith('Merge '));
}

function getSection(title) {
  const match = title.match(/^([a-z]+)(?:\([^)]+\))?!?:\s/i);
  return typeSections.get(match?.[1]?.toLowerCase()) ?? 'Other';
}

function renderCommits(commits) {
  const groups = new Map(sectionOrder.map((section) => [section, []]));

  for (const commit of commits) {
    groups.get(getSection(commit.title)).push(commit);
  }

  return sectionOrder
    .flatMap((section) => {
      const sectionCommits = groups.get(section);

      if (sectionCommits.length === 0) {
        return [];
      }

      return [`### ${section}`, '', ...sectionCommits.map(({ sha, title }) => `- \`${sha}\` ${title}`), ''];
    })
    .join('\n')
    .trimEnd();
}

function getDate(ref) {
  return capture('git', ['log', '-1', '--format=%cs', ref]);
}

function renderRelease(version, date, commits) {
  const body = renderCommits(commits);
  return [`## [${version}] - ${date}`, '', body || '- No user-facing changes.'].join('\n');
}

function getRange(previousTag, ref) {
  return previousTag ? `${previousTag}..${ref}` : ref;
}

function generateChangelog(pendingVersion) {
  const tags = getTags();
  const releases = [];
  let previousTag;

  for (const tag of tags) {
    releases.push(renderRelease(tag.slice(1), getDate(tag), getCommits(getRange(previousTag, tag))));
    previousTag = tag;
  }

  const unreleasedCommits = getCommits(getRange(previousTag, 'HEAD'));
  let unreleased = renderCommits(unreleasedCommits);

  if (pendingVersion) {
    releases.push(renderRelease(pendingVersion, new Date().toISOString().slice(0, 10), unreleasedCommits));
    unreleased = '';
  }

  const content = [
    '# Changelog',
    '',
    'All notable changes to this project are documented in this file.',
    '',
    'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),',
    'and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).',
    '',
    '## [Unreleased]',
    '',
    unreleased,
    ...releases.reverse().flatMap((release) => ['', release]),
    '',
  ].join('\n');

  writeFileSync(CHANGELOG_PATH, content);
}

function getReleaseNotes(versionOrTag) {
  const version = versionOrTag.replace(/^v/, '');
  const changelog = readFileSync(CHANGELOG_PATH, 'utf8');
  const heading = `## [${version}]`;
  const start = changelog.indexOf(heading);

  if (start === -1) {
    throw new Error(`${CHANGELOG_PATH} is missing a ${heading} release heading.`);
  }

  const nextHeading = changelog.indexOf('\n## [', start + heading.length);
  return changelog.slice(start, nextHeading === -1 ? undefined : nextHeading).trim();
}

function ensureReleaseReady() {
  const branch = capture('git', ['branch', '--show-current']);
  const status = capture('git', ['status', '--porcelain']);
  const tags = getTags();
  const latestTag = tags.at(-1);
  const pkg = readJson(PACKAGE_PATH);
  const lock = readJson(LOCK_PATH);

  if (branch !== 'main') {
    throw new Error(`Releases must be created from main. Current branch: ${branch || '(detached HEAD)'}.`);
  }

  if (status) {
    throw new Error('Working tree must be clean before releasing.');
  }

  if (lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version) {
    throw new Error(`${LOCK_PATH} does not match ${PACKAGE_PATH} version ${pkg.version}.`);
  }

  if (latestTag && latestTag !== `v${pkg.version}`) {
    throw new Error(`Latest tag ${latestTag} does not match ${PACKAGE_PATH} version ${pkg.version}.`);
  }
}

function release(versionBump, shouldPush) {
  if (!['patch', 'minor', 'major'].includes(versionBump)) {
    throw new Error('Usage: npm run release -- <patch|minor|major> [--push]');
  }

  ensureReleaseReady();
  run('npm', ['run', 'check']);
  run('npm', ['test', '--', '--run']);
  run('npm', ['version', versionBump, '--no-git-tag-version']);

  const version = readJson(PACKAGE_PATH).version;
  const tag = `v${version}`;

  generateChangelog(version);
  run('git', ['add', PACKAGE_PATH, LOCK_PATH, CHANGELOG_PATH]);
  run('git', ['commit', '-m', `chore(release): ${tag}`]);
  run('git', ['tag', '-a', tag, '-m', tag]);

  if (shouldPush) {
    run('git', ['push', 'origin', 'main', '--follow-tags']);
    console.log(`Released ${tag}. The publish workflow has been triggered.`);
    return;
  }

  console.log(`Prepared ${tag}. Review it, then run: git push origin main --follow-tags`);
}

const [command = 'changelog', ...args] = process.argv.slice(2);

if (command === 'changelog') {
  generateChangelog();
  console.log(`Regenerated ${CHANGELOG_PATH}.`);
} else if (command === 'release-notes') {
  const [versionOrTag] = args;

  if (!versionOrTag) {
    throw new Error('Usage: node scripts/release.mjs release-notes <version|tag>');
  }

  console.log(getReleaseNotes(versionOrTag));
} else if (command === 'release') {
  release(
    args.find((arg) => !arg.startsWith('--')),
    args.includes('--push'),
  );
} else {
  throw new Error('Usage: node scripts/release.mjs <changelog|release|release-notes> [arguments]');
}
