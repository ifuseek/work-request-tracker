// Work Request Tracker v1.7.1
// Confirms every file carries the same version as APP_VERSION in Code.gs,
// and that CHANGELOG.md and package.json match. Fails the build if anything is out of step.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const m = read('Code.gs').match(/const APP_VERSION = '([\d.]+)'/);
if (!m) { console.error('APP_VERSION not found in Code.gs'); process.exit(1); }
const v = m[1];
const problems = [];
const inline = ['Code.gs', 'Tenant.html', 'Landlord.html', 'Shared.html', 'Styles.html', '.claspignore', '.gitignore',
  'scripts/check-version.js', 'scripts/bump-version.js', 'scripts/deploy.js', 'scripts/login.mjs', 'tests/flow.test.js', 'docs/SETUP.md', 'docs/DEVELOPMENT.md'];
inline.forEach((f) => {
  if (!fs.existsSync(path.join(root, f))) return problems.push(f + ' is missing');
  const head = read(f).split('\n').slice(0, 5).join('\n');
  if (!head.includes('v' + v)) problems.push(f + ' does not show v' + v + ' in its first lines');
});
if (JSON.parse(read('package.json')).version !== v) problems.push('package.json version is not ' + v);
if (!read('CHANGELOG.md').includes('## ' + v + ' ')) problems.push('CHANGELOG.md has no "## ' + v + '" entry');
const tag = process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : '';
if (tag && tag !== 'v' + v) problems.push('Tag ' + tag + ' does not match APP_VERSION v' + v);

if (problems.length) { console.error('Version check failed:\n- ' + problems.join('\n- ')); process.exit(1); }
console.log('Version check passed: every file is v' + v);
