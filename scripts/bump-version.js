// Work Request Tracker v1.7.1
// Moves every file to a new version and adds a CHANGELOG entry to fill in.
// Usage: npm run bump -- 1.8.0
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const next = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(next || '')) { console.error('Usage: npm run bump -- 1.8.0'); process.exit(1); }
const code = fs.readFileSync(path.join(root, 'Code.gs'), 'utf8');
const cur = code.match(/const APP_VERSION = '([\d.]+)'/)[1];
if (cur === next) { console.error('Already at ' + next); process.exit(1); }
const esc = cur.replace(/\./g, '\\.');
const files = ['Code.gs', 'Tenant.html', 'Landlord.html', 'Shared.html', 'Styles.html', '.claspignore', '.gitignore',
  'scripts/check-version.js', 'scripts/bump-version.js', 'scripts/deploy.js', 'tests/flow.test.js', 'docs/SETUP.md', 'docs/DEVELOPMENT.md'];
files.forEach((f) => {
  const p = path.join(root, f);
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(new RegExp('v' + esc + '\\b', 'g'), 'v' + next);
  if (f === 'Code.gs') s = s.replace("const APP_VERSION = '" + cur + "'", "const APP_VERSION = '" + next + "'");
  fs.writeFileSync(p, s);
});
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
const clPath = path.join(root, 'CHANGELOG.md');
const cl = fs.readFileSync(clPath, 'utf8');
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(clPath, cl.replace(/\n## /, '\n## ' + next + ' (' + today + ')\n\n- Describe the change here\n\n## '));
console.log('Moved ' + cur + ' to ' + next + '. Fill in the CHANGELOG entry, then commit.');
