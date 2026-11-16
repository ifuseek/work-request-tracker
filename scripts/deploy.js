// Work Request Tracker v1.7.1
// Sends the code to Google Apps Script with clasp. Used by GitHub Actions and, optionally, on your computer.
//   node scripts/deploy.js push      Upload the code. The test (/dev) link runs it immediately.
//   node scripts/deploy.js release   Upload, save a numbered version, and point the live (/exec)
//                                    deployment at it. The live URL stays the same.
// Settings come from environment variables (GitHub secrets) or local files that are never committed:
//   SCRIPT_ID      or .clasp.json   The Apps Script project (Project Settings > IDs > Script ID)
//   DEPLOYMENT_ID  or .deploy.json  The live web app (Deploy > Manage deployments > Deployment ID)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const mode = process.argv[2];

function clasp(args) {
  const bin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'clasp.cmd' : 'clasp');
  const out = execFileSync(fs.existsSync(bin) ? bin : 'clasp', args, { cwd: root, encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'] });
  process.stdout.write(out);
  return out;
}

function connect() {
  const file = path.join(root, '.clasp.json');
  if (process.env.SCRIPT_ID) {
    fs.writeFileSync(file, JSON.stringify({ scriptId: process.env.SCRIPT_ID.trim(), rootDir: '.' }, null, 2));
  } else if (!fs.existsSync(file)) {
    console.error('No Apps Script project set. Set SCRIPT_ID, or create .clasp.json (see docs/DEVELOPMENT.md).');
    process.exit(1);
  }
}

function deploymentId() {
  if (process.env.DEPLOYMENT_ID) return process.env.DEPLOYMENT_ID.trim();
  const file = path.join(root, '.deploy.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).deploymentId : '';
}

if (!['connect', 'push', 'release'].includes(mode)) {
  console.error('Usage: node scripts/deploy.js push | release');
  process.exit(1);
}
connect();
if (mode === 'connect') process.exit(0);

execFileSync(process.execPath, [path.join(__dirname, 'check-version.js')], { stdio: 'inherit' });
const version = fs.readFileSync(path.join(root, 'Code.gs'), 'utf8').match(/const APP_VERSION = '([\d.]+)'/)[1];

console.log('\nUploading v' + version + ' to Apps Script…');
clasp(['push', '--force']);
if (mode === 'push') {
  console.log('\nDone. The test (/dev) link now runs v' + version + '. The live (/exec) link is unchanged.');
  process.exit(0);
}

console.log('\nSaving version v' + version + '…');
const out = clasp(['create-version', 'v' + version]);
const num = (out.match(/(\d+)\.?\s*$/m) || out.match(/"versionNumber":\s*(\d+)/) || [])[1];
if (!num) { console.error('Could not read the new version number from clasp.'); process.exit(1); }

const id = deploymentId();
if (!id) {
  console.error('\nNo DEPLOYMENT_ID set, so the live web app was not updated. Saved as Apps Script version ' + num + '.');
  process.exit(1);
}
console.log('\nPointing the live web app at version ' + num + '…');
clasp(['update-deployment', id, '-V', num, '-d', 'v' + version]);
console.log('\nDone. The live (/exec) link now runs v' + version + ' (Apps Script version ' + num + '). The URL is unchanged.');
