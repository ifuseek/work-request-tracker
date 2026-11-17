// Work Request Tracker v1.7.1
// Least-privilege sign-in for clasp. The standard `clasp login` asks for broad Google Cloud
// access (cloud-platform, logging, service management, Drive metadata). Pushing code, saving
// versions and updating the web app deployment use only the Apps Script API, so this signs in
// with just those permissions. Credentials are saved to ~/.clasprc.json like a normal login.
// Usage: npm run login
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL, fileURLToPath } from 'node:url';

const SCOPES = [
  'https://www.googleapis.com/auth/script.projects',    // upload code and save versions
  'https://www.googleapis.com/auth/script.deployments', // point the web app at a new version
  'https://www.googleapis.com/auth/userinfo.email'      // confirm which account signed in
];

const claspRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', '@google', 'clasp');
const load = (p) => import(pathToFileURL(path.join(claspRoot, 'build/src/auth', p)).href);
const { authorize, getUnauthorizedOuth2Client, getUserInfo } = await load('auth.js');
const { FileCredentialStore } = await load('file_credential_store.js');

console.log('Signing in with these permissions only:\n  ' + SCOPES.join('\n  ') + '\n');
const store = new FileCredentialStore(path.join(os.homedir(), '.clasprc.json'));
const client = await authorize({
  store, userKey: 'default', oauth2Client: getUnauthorizedOuth2Client(), scopes: SCOPES, noLocalServer: true
});
const user = await getUserInfo(client);
console.log('\nSigned in as ' + ((user && user.email) || 'your Google account') + '. Credentials saved to ~/.clasprc.json');
