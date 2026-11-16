// Work Request Tracker v1.7.1
// Server flow tests: mocks the Apps Script services in Node and exercises Code.gs end to end.
// Run with: npm test
const fs = require('fs');
const vm = require('vm');
const path = process.argv[2] || require('path').join(__dirname, '..');
const code = fs.readFileSync(path + '/Code.gs', 'utf8');

function makeSheet(name) {
  const rows = [];
  const sheet = {
    name, rows,
    getLastRow: () => rows.length,
    appendRow: (r) => rows.push(r.slice()),
    getRange: (r, c, nr = 1, nc = 1) => ({
      setValues: (vals) => { vals.forEach((v, i) => { rows[r - 1 + i] = rows[r - 1 + i] || []; v.forEach((x, j) => rows[r - 1 + i][c - 1 + j] = x); }); return { setFontWeight() {} }; },
      setValue: (v) => { rows[r - 1] = rows[r - 1] || []; rows[r - 1][c - 1] = v; return { setFontWeight() {} }; },
      getValues: () => { const out = []; for (let i = 0; i < nr; i++) { const row = rows[r - 1 + i] || []; const o = []; for (let j = 0; j < nc; j++) o.push(row[c - 1 + j] === undefined ? '' : row[c - 1 + j]); out.push(o); } return out; },
      setFontWeight() { return this; }
    }),
    setFrozenRows() {}, autoResizeColumns() {}
  };
  return sheet;
}
const sheets = {};
const mails = [];
let uuid = 0;
const ctx = {
  console,
  SpreadsheetApp: {
    getActive: () => ({
      getSheetByName: (n) => sheets[n] || null, getId: () => 'SS1',
      insertSheet: (n) => (sheets[n] = makeSheet(n))
    }),
    flush() {}
  },
  MailApp: { sendEmail: (to, subj, body, opts) => mails.push({ to, subj, body, opts }) },
  Utilities: {
    getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-' + String(++uuid).padStart(12, '0'),
    formatDate: (d) => new Date(d).toISOString(),
    base64Decode: (s) => Buffer.from(s, 'base64'),
    newBlob: (b, t, n) => ({ bytes: b, type: t, name: n })
  },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  DriveApp: {
    Access: { ANYONE_WITH_LINK: 1 }, Permission: { VIEW: 1 },
    createFolder: () => ({ getId: () => 'F1', createFile: (b) => ({ getUrl: () => 'https://drive/' + b.name, setSharing() {} }) }),
    getFolderById: () => ({ createFile: (b) => ({ getUrl: () => 'https://drive/' + b.name, setSharing() {} }) })
  },
  Drive: {
    Files: {
      create: (meta, blob) => ({ id: 'id-' + meta.name, webViewLink: 'https://drive/' + meta.name }),
      get: (id) => ({ id, trashed: false })
    },
    Permissions: { create: () => ({}) }
  },
  PropertiesService: { getScriptProperties: () => { const p = {}; return { getProperty: (k) => p[k], setProperty: (k, v) => p[k] = v }; } },
  Session: { getEffectiveUser: () => ({ getEmail: () => 'tenant@example.com' }), getScriptTimeZone: () => 'America/Los_Angeles' },
  Logger: { log: () => {} },
  ScriptApp: { getProjectTriggers: () => [] },
  HtmlService: {}
};
vm.createContext(ctx);
vm.runInContext(code, ctx);
const run = (s) => vm.runInContext(s, ctx);

run('setup()');
// configure
const cfg = sheets.Config.rows;
const set = (k, v) => { cfg.find(r => r[0] === k)[1] = v; };
set('LANDLORD_EMAIL', 'landlord@example.com');
set('TENANT_NAME', 'Kristin');
set('WEB_APP_URL', 'https://script.google.com/exec');
const KEY = cfg.find(r => r[0] === 'TENANT_KEY')[1];
const LKEY = cfg.find(r => r[0] === 'LANDLORD_KEY')[1];
ctx.KEY = KEY; ctx.LKEY = LKEY;

const assert = (c, m) => { if (!c) { console.error('FAIL: ' + m); process.exit(1); } else console.log('ok - ' + m); };

const r1 = run(`tenantCreate(KEY, {title:'Garage gutter', category:'Roof / gutters', priority:'Standard', location:'Garage', description:'Gutter came apart', access:'Exterior only', photos:[{mimeType:'image/jpeg', data:'aGVsbG8='}], building:'Cottage', area:'Exterior'})`);
assert(r1.id === 'WR-0001', 'creates WR-0001');
assert(mails.length === 1 && mails[0].to === 'landlord@example.com', 'emails landlord on new request');
assert(mails[0].opts.attachments.length === 1, 'attaches photo');
assert(/\?r=WR-0001&amp;t=/.test(mails[0].opts.htmlBody), 'email contains landlord link');
const token = sheets.Requests.rows[1][12];
ctx.TOKEN = token;

let threw = false;
try { run(`landlordAction('WR-0001', 'wrongtoken', 'acknowledge', '', '')`); } catch (e) { threw = true; }
assert(threw, 'rejects bad landlord token');
threw = false;
try { run(`tenantList('bad')`); } catch (e) { threw = true; }
assert(threw, 'rejects bad tenant key');

let d = run(`landlordAction('WR-0001', TOKEN, 'acknowledge', 'Got it', '')`);
assert(d.status === 'Acknowledged', 'acknowledge sets status');
assert(mails[mails.length - 1].to === 'tenant@example.com', 'tenant notified of landlord action');
threw = false;
try { run(`landlordAction('WR-0001', TOKEN, 'decline', '', '')`); } catch (e) { threw = true; }
assert(threw, 'decline requires reason');
d = run(`landlordAction('WR-0001', TOKEN, 'schedule', 'Contractor coming', 'Tue Nov 24, 10-12')`);
assert(d.status === 'Scheduled' && d.scheduledFor === 'Tue Nov 24, 10-12', 'schedule sets time');
d = run(`landlordAction('WR-0001', TOKEN, 'update', 'Parts ordered', '')`);
assert(d.status === 'Scheduled', 'update keeps Scheduled status');
d = run(`tenantAction(KEY, 'WR-0001', 'confirm', '')`);
assert(d.log.some(l => /^Confirmed visit/.test(l.action)) && d.tenantConfirmed, 'tenant confirms time');
threw=false; try { run(`tenantAction(KEY, 'WR-0001', 'confirm', '')`); } catch(e){ threw=true; }
assert(threw, 'cannot confirm twice');
threw=false; try { run(`landlordAction('WR-0001', TOKEN, 'schedule', '', 'Wed')`); } catch(e){ threw=true; }
assert(threw, 'schedule blocked once scheduled; must use change');
threw=false; try { run(`tenantAction(KEY, 'WR-0001', 'change', '')`); } catch(e){ threw=true; }
assert(threw, 'tenant change request needs a reason');
d = run(`tenantAction(KEY, 'WR-0001', 'change', 'Out of town that day, any time Thu works')`);
assert(d.status === 'Change requested' && !d.tenantConfirmed, 'tenant change request sets status and clears confirmation');
const fut = new Date(Date.now() + 3*86400000); const futEnd = new Date(fut.getTime() + 4*3600000);
ctx.SCH = {text:'Thursday, Afternoon', start: fut.toISOString(), end: futEnd.toISOString()};
d = run(`landlordAction('WR-0001', TOKEN, 'schedule', 'Thursday then', SCH)`);
assert(d.status === 'Scheduled' && d.scheduledEnd, 'landlord proposes new time with start and end');
assert(/calendar\.google\.com\/calendar\/render\?action=TEMPLATE/.test(d.gcal) && /\?ics=WR-0001&t=/.test(d.ics), 'landlord gets add-to-calendar links');
const td = run(`tenantDetail(KEY, 'WR-0001')`);
assert(/\?ics=WR-0001&k=/.test(td.ics), 'tenant gets own .ics link');
threw=false; try { run(`landlordAction('WR-0001', TOKEN, 'reschedule', '', SCH)`); } catch(e){ threw=true; }
assert(threw, 'landlord change request needs a reason');
d = run(`landlordAction('WR-0001', TOKEN, 'reschedule', 'Contractor moved it', SCH)`);
assert(d.status === 'Scheduled', 'landlord reschedule keeps Scheduled');
ctx.ContentService = { MimeType:{ICAL:'ical'}, createTextOutput: (t)=>{ const o={text:t}; o.setMimeType=(m)=>{o.mime=m;return o}; o.downloadAsFile=(n)=>{o.file=n;return o}; return o; } };
const ics = run(`icsResponse_({ics:'WR-0001', k:KEY})`);
assert(/BEGIN:VEVENT/.test(ics.text) && ics.mime==='ical' && ics.file==='WR-0001-visit.ics', 'ICS file served');
const bad = run(`icsResponse_({ics:'WR-0001', k:'nope'})`);
assert(!/BEGIN/.test(bad.text), 'ICS rejects bad key');
d = run(`landlordAction('WR-0001', TOKEN, 'complete', 'Done', '')`);
assert(d.status === 'Completed' && !d.open, 'complete closes request');
threw = false;
try { run(`landlordAction('WR-0001', TOKEN, 'update', 'x', '')`); } catch (e) { threw = true; }
assert(threw, 'closed request rejects landlord action');
d = run(`tenantAction(KEY, 'WR-0001', 'reopen', 'Still leaking')`);
assert(d.status === 'Submitted', 'reopen works');
const r2 = run(`tenantCreate(KEY, {title:'Trees', category:'Trees / grounds', priority:'Urgent (safety, no heat, water or power)', description:'Large limbs', building:'Grounds', area:'Exterior'})`);
assert(r2.id === 'WR-0002', 'sequential ids');
threw = false;
try { run(`landlordAction('WR-0002', TOKEN, 'acknowledge', '', '')`); } catch (e) { threw = true; }
assert(threw, 'one request token cannot act on another request');
const list = run('landlordList(LKEY)');
assert(list.length === 2 && /\?r=WR-0002&t=/.test(list[0].link), 'landlord overview lists requests with links');
// age request 2 and send reminder
sheets.Requests.rows[2][1] = new Date(Date.now() - 5 * 86400000);
const before = mails.length;
run('sendReminders()');
assert(mails.length === before + 1, "reminder sent only for the overdue request");
run('sendReminders()');
assert(mails.length === before + 1, "no duplicate reminder the same day");
const html = mails[0].opts.htmlBody;
run(`tenantCreate(KEY, {title:'<script>x</script>', description:'<b>bold</b>', building:'Main house', area:'Interior'})`);
assert(!/<script>x/.test(mails[mails.length - 1].opts.htmlBody), 'email output escaped');
threw=false; try { run(`tenantCreate(KEY, {title:'x', description:'y'})`); } catch(e){ threw=true; }
assert(threw, 'building and interior/exterior required');
const d1 = run(`tenantDetail(KEY, 'WR-0001')`);
assert(d1.building === 'Cottage' && d1.area === 'Exterior', 'building and area saved');
assert(/Cottage · Exterior/.test(mails[0].opts.htmlBody), 'email shows where');
const tok3 = sheets.Requests.rows[3][12]; ctx.TOK3 = tok3;
threw=false; try { run(`landlordAction('WR-0003', TOK3, 'schedule', '', 'Sat Nov 21', {who:'Contractor', company:'Acme HVAC', name:'Sam'})`); } catch(e){ threw=true; }
assert(threw, 'interior contractor visit requires phone');
let d3 = run(`landlordAction('WR-0003', TOK3, 'schedule', 'See you then', 'Saturday, November 21, 2026, Afternoon, 12:00 PM to 4:00 PM', {who:'Contractor', company:'Acme HVAC', name:'Sam Lee', phone:'503-555-0100', details:'White van'})`);
const last = d3.log[d3.log.length-1];
assert(/Company: Acme HVAC/.test(last.note) && /Phone: 503-555-0100/.test(last.note) && /See you then/.test(last.note), 'visitor details recorded in log');
assert(/Acme HVAC/.test(mails[mails.length-1].opts.htmlBody), 'tenant email includes visitor details');
let before2 = mails.length;
run(`sendLandlordInvite('Hi, starting this today.', true)`);
assert(mails.length === before2 + 1 && mails[mails.length-1].to === 'tenant@example.com' && /TEST COPY/.test(mails[mails.length-1].subj), 'test invite goes to me only');
run(`sendLandlordInvite('<b>note</b>', false)`);
const inv = mails[mails.length-1];
assert(inv.to === 'landlord@example.com' && /About privacy/.test(inv.opts.htmlBody) && inv.opts.htmlBody.indexOf('?lk=' + LKEY) > 0, 'invite to landlord with privacy note and overview link');
assert(!/<b>note/.test(inv.opts.htmlBody), 'invite note escaped');
const oldTok = sheets.Requests.rows[1][12];
ctx.SpreadsheetApp.getUi = () => { throw new Error('no ui'); };
run('resetLandlordLinks()');
const newL = cfg.find(r => r[0] === 'LANDLORD_KEY')[1];
assert(newL !== LKEY && sheets.Requests.rows[1][12] !== oldTok, 'reset replaces overview key and request tokens');
threw=false; try { run(`landlordList(LKEY)`); } catch(e){ threw=true; }
assert(threw, 'old overview link stops working');
threw=false; try { run(`landlordDetail('WR-0001', TOKEN)`); } catch(e){ threw=true; }
assert(threw, 'old request link stops working');
console.log('ALL PASSED');
