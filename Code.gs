/**
 * Work Request Tracker
 * A simple, reusable repair-request workflow between a tenant and a landlord.
 *
 * - Data lives in the Google Sheet this script is bound to.
 * - The tenant uses a private link (TENANT_KEY) to submit and follow requests.
 * - The landlord needs no account: every request email contains a private
 *   per-request link where they can acknowledge, schedule, update, complete
 *   or decline (with a reason). Every action is time-stamped in the Log tab.
 *
 * Setup: run setup() once from the Apps Script editor, then deploy as a web app
 * (Execute as: Me, Who has access: Anyone). See README.md.
 */

const SHEET_REQUESTS = 'Requests';
const SHEET_LOG = 'Log';
const SHEET_CONFIG = 'Config';
const PHOTO_FOLDER_NAME = 'Work Request Photos';

const REQUEST_HEADERS = [
  'ID', 'Created', 'Updated', 'Title', 'Category', 'Priority', 'Location',
  'Description', 'Access notes', 'Photos', 'Status', 'Scheduled for',
  'Token', 'Last reminder'
];
const LOG_HEADERS = ['Timestamp', 'Request ID', 'Who', 'Action', 'Note'];

const STATUS = {
  SUBMITTED: 'Submitted',
  ACKNOWLEDGED: 'Acknowledged',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  DECLINED: 'Declined',
  WITHDRAWN: 'Withdrawn'
};
const OPEN_STATUSES = [STATUS.SUBMITTED, STATUS.ACKNOWLEDGED, STATUS.SCHEDULED, STATUS.IN_PROGRESS];

const CATEGORIES = ['Heating / air quality', 'Plumbing / septic', 'Electrical', 'Appliance',
  'Roof / gutters', 'Trees / grounds', 'Safety (alarms, locks)', 'Structure / exterior', 'Other'];
const PRIORITIES = ['Urgent (safety, no heat, water or power)', 'Standard', 'Routine'];

const DEFAULT_CONFIG = {
  PROPERTY_NAME: 'Your Property',
  TENANT_NAME: 'Tenant',
  TENANT_EMAIL: '',
  LANDLORD_NAME: 'Landlord',
  LANDLORD_EMAIL: '',
  URGENT_RESPONSE: 'within 24 hours',
  STANDARD_RESPONSE: 'within 3 business days',
  ROUTINE_RESPONSE: 'within 7 days',
  REMINDER_AFTER_DAYS: '3',
  WEB_APP_URL: '',
  TENANT_KEY: '',
  LANDLORD_KEY: ''
};

/* ------------------------------------------------------------------ */
/* Sheet menu                                                         */
/* ------------------------------------------------------------------ */

/** Adds a "Work Requests" menu to the Sheet so no one needs the script editor. */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Work Requests')
    .addItem('1. Set up tracker', 'setup')
    .addItem('2. Show my links', 'showLinks')
    .addSeparator()
    .addItem('Turn on daily reminders', 'installReminderTrigger')
    .addItem('Send reminders now', 'sendReminders')
    .addToUi();
}

/** Shows a message in the Sheet when run from the menu; logs it otherwise. */
function notify_(title, message) {
  Logger.log(title + ': ' + message);
  try { SpreadsheetApp.getUi().alert(title, message, SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) { /* run from editor */ }
}

/* ------------------------------------------------------------------ */
/* Setup                                                              */
/* ------------------------------------------------------------------ */

/** Run once (Work Requests > 1. Set up tracker). Creates the tabs, keys and photo folder. */
function setup() {
  const ss = SpreadsheetApp.getActive();
  ensureSheet_(ss, SHEET_REQUESTS, REQUEST_HEADERS);
  ensureSheet_(ss, SHEET_LOG, LOG_HEADERS);

  let cfg = ss.getSheetByName(SHEET_CONFIG);
  if (!cfg) {
    cfg = ss.insertSheet(SHEET_CONFIG);
    cfg.getRange(1, 1, 1, 2).setValues([['Setting', 'Value']]).setFontWeight('bold');
  }
  const existing = readConfig_();
  const rows = [];
  Object.keys(DEFAULT_CONFIG).forEach(function (k) {
    if (!(k in existing)) {
      let v = DEFAULT_CONFIG[k];
      if (k === 'TENANT_KEY' || k === 'LANDLORD_KEY') v = newToken_();
      if (k === 'TENANT_EMAIL' && !v) v = Session.getEffectiveUser().getEmail();
      rows.push([k, v]);
    }
  });
  if (rows.length) cfg.getRange(cfg.getLastRow() + 1, 1, rows.length, 2).setValues(rows);
  cfg.autoResizeColumns(1, 2);

  photoFolder_();
  SpreadsheetApp.flush();
  try { cfg.activate(); } catch (e) { /* run from editor */ }
  notify_('Setup complete',
    'Next steps:\n\n' +
    '1. On this Config tab, fill in the names, emails and response times in column B. ' +
    'Use your own email for LANDLORD_EMAIL while testing.\n\n' +
    '2. Deploy the web app (Extensions > Apps Script > Deploy > New deployment > Web app; ' +
    'Execute as Me; Who has access: Anyone).\n\n' +
    '3. Paste the web app URL into WEB_APP_URL, then choose Work Requests > 2. Show my links.');
}

/** Shows the private links (Work Requests > 2. Show my links). */
function showLinks() {
  const c = config_();
  if (!c.WEB_APP_URL) {
    notify_('Web app URL needed',
      'Deploy the web app first, then paste its URL (ending in /exec) into WEB_APP_URL on the Config tab.');
    return;
  }
  const tenant = c.WEB_APP_URL + '?k=' + c.TENANT_KEY;
  const landlord = c.WEB_APP_URL + '?lk=' + c.LANDLORD_KEY;
  Logger.log('Your tenant link (keep private): ' + tenant);
  Logger.log('Landlord overview link (optional): ' + landlord);
  const box = function (label, help, url, id) {
    return '<p style="margin:16px 0 4px"><b>' + esc_(label) + '</b><br><span style="color:#616e7c">' + esc_(help) +
      '</span></p><input id="' + id + '" readonly value="' + esc_(url) + '" style="width:100%;padding:6px;font-size:12px">' +
      '<p style="margin:6px 0"><button onclick="var i=document.getElementById(\'' + id + '\');i.select();' +
      'document.execCommand(\'copy\');this.textContent=\'Copied\'">Copy</button> ' +
      '<a href="' + esc_(url) + '" target="_blank">Open</a></p>';
  };
  try {
    const html = HtmlService.createHtmlOutput(
      '<div style="font-family:Arial,sans-serif;font-size:14px">' +
      box('Your tenant link', 'Bookmark it and keep it private. It works like a password.', tenant, 't') +
      box('Landlord overview link (optional)', 'Lists all requests. The landlord also gets a link in every email.', landlord, 'l') +
      '</div>').setWidth(520).setHeight(360);
    SpreadsheetApp.getUi().showModalDialog(html, 'Your links');
  } catch (e) { /* run from editor: links are in the execution log */ }
}

/** Optional: daily reminder to the landlord for requests not yet acknowledged. */
function installReminderTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sendReminders') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendReminders').timeBased().everyDays(1).atHour(9).create();
  notify_('Daily reminders on',
    'Each morning around 9 AM, the landlord gets one reminder for any request still "Submitted" after ' +
    (config_().REMINDER_AFTER_DAYS || 3) + ' days.');
}

/* ------------------------------------------------------------------ */
/* Web entry point                                                    */
/* ------------------------------------------------------------------ */

function doGet(e) {
  const p = (e && e.parameter) || {};
  const c = config_();
  let t;
  if (p.k && safeEqual_(p.k, c.TENANT_KEY)) {
    t = HtmlService.createTemplateFromFile('Tenant');
    t.key = p.k;
  } else if (p.r && p.t && findRequest_(p.r) && safeEqual_(p.t, findRequest_(p.r).token)) {
    t = HtmlService.createTemplateFromFile('Landlord');
    t.mode = 'request';
    t.id = p.r;
    t.token = p.t;
    t.lkey = '';
  } else if (p.lk && safeEqual_(p.lk, c.LANDLORD_KEY)) {
    t = HtmlService.createTemplateFromFile('Landlord');
    t.mode = 'list';
    t.id = '';
    t.token = '';
    t.lkey = p.lk;
  } else {
    return HtmlService.createHtmlOutput(
      '<p style="font-family:sans-serif;padding:24px">This link is not valid. Please use the link from your email.</p>');
  }
  t.property = c.PROPERTY_NAME;
  t.categories = CATEGORIES;
  t.priorities = PRIORITIES;
  t.responseTimes = {
    urgent: c.URGENT_RESPONSE, standard: c.STANDARD_RESPONSE, routine: c.ROUTINE_RESPONSE
  };
  return t.evaluate()
    .setTitle(c.PROPERTY_NAME + ' Work Requests')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

/* ------------------------------------------------------------------ */
/* Tenant API                                                         */
/* ------------------------------------------------------------------ */

function tenantList(key) {
  requireTenant_(key);
  return allRequests_().map(publicRequest_);
}

function tenantDetail(key, id) {
  requireTenant_(key);
  return detail_(id);
}

function tenantCreate(key, form) {
  requireTenant_(key);
  const title = clean_(form.title, 120);
  const description = clean_(form.description, 4000);
  if (!title || !description) throw new Error('Please add a title and a description.');
  const category = CATEGORIES.indexOf(form.category) >= 0 ? form.category : 'Other';
  const priority = PRIORITIES.indexOf(form.priority) >= 0 ? form.priority : 'Standard';

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = sheet_(SHEET_REQUESTS);
    const id = nextId_(sheet);
    const now = new Date();
    const files = savePhotos_(id, form.photos || []);
    const token = newToken_();
    sheet.appendRow([
      id, now, now, title, category, priority, clean_(form.location, 200), description,
      clean_(form.access, 1000), files.map(function (f) { return f.url; }).join('\n'),
      STATUS.SUBMITTED, '', token, ''
    ]);
    log_(id, 'Tenant', 'Submitted request', '');
    const req = findRequest_(id);
    notifyLandlordNew_(req, files);
    return publicRequest_(req);
  } finally {
    lock.releaseLock();
  }
}

/** action: comment | withdraw | confirm | reopen */
function tenantAction(key, id, action, note) {
  requireTenant_(key);
  const req = mustFind_(id);
  note = clean_(note, 2000);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (action === 'comment') {
      if (!note) throw new Error('Please enter a message.');
      log_(id, 'Tenant', 'Comment', note);
      touch_(req, null);
      notifyLandlordUpdate_(req, 'Comment from ' + config_().TENANT_NAME, note);
    } else if (action === 'confirm') {
      if (req.status !== STATUS.SCHEDULED) throw new Error('There is no scheduled time to confirm.');
      log_(id, 'Tenant', 'Confirmed scheduled time', note);
      touch_(req, null);
      notifyLandlordUpdate_(req, 'Scheduled time confirmed', note || 'The scheduled time works.');
    } else if (action === 'withdraw') {
      if (OPEN_STATUSES.indexOf(req.status) < 0) throw new Error('This request is already closed.');
      log_(id, 'Tenant', 'Withdrew request', note);
      touch_(req, STATUS.WITHDRAWN);
      notifyLandlordUpdate_(req, 'Request withdrawn', note || 'No longer needed.');
    } else if (action === 'reopen') {
      if (req.status !== STATUS.COMPLETED) throw new Error('Only completed requests can be reopened.');
      if (!note) throw new Error('Please say what still needs attention.');
      log_(id, 'Tenant', 'Reopened request', note);
      touch_(req, STATUS.SUBMITTED);
      notifyLandlordUpdate_(req, 'Request reopened', note);
    } else {
      throw new Error('Unknown action.');
    }
  } finally {
    lock.releaseLock();
  }
  return detail_(id);
}

/* ------------------------------------------------------------------ */
/* Landlord API                                                       */
/* ------------------------------------------------------------------ */

function landlordDetail(id, token) {
  requireLandlordToken_(id, token);
  return detail_(id);
}

function landlordList(lkey) {
  if (!safeEqual_(lkey, config_().LANDLORD_KEY)) throw new Error('Link not valid.');
  return allRequests_().map(function (r) {
    const pr = publicRequest_(r);
    pr.link = landlordLink_(r);
    return pr;
  });
}

/** action: acknowledge | schedule | update | complete | decline */
function landlordAction(id, token, action, note, scheduledFor) {
  requireLandlordToken_(id, token);
  const req = mustFind_(id);
  note = clean_(note, 2000);
  if (OPEN_STATUSES.indexOf(req.status) < 0) throw new Error('This request is closed (' + req.status + ').');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  let subject, body;
  try {
    if (action === 'acknowledge') {
      log_(id, 'Landlord', 'Acknowledged', note);
      touch_(req, req.status === STATUS.SUBMITTED ? STATUS.ACKNOWLEDGED : null);
      subject = 'Acknowledged'; body = note || 'Your request has been received.';
    } else if (action === 'schedule') {
      const when = clean_(scheduledFor, 100);
      if (!when) throw new Error('Please enter a date and time window.');
      log_(id, 'Landlord', 'Scheduled: ' + when, note);
      touch_(req, STATUS.SCHEDULED, when);
      subject = 'Scheduled for ' + when; body = note || 'Work has been scheduled.';
    } else if (action === 'update') {
      if (!note) throw new Error('Please enter an update.');
      log_(id, 'Landlord', 'Update', note);
      touch_(req, req.status === STATUS.SCHEDULED ? null : STATUS.IN_PROGRESS);
      subject = 'Update'; body = note;
    } else if (action === 'complete') {
      log_(id, 'Landlord', 'Marked complete', note);
      touch_(req, STATUS.COMPLETED);
      subject = 'Marked complete'; body = note || 'The work has been completed.';
    } else if (action === 'decline') {
      if (!note) throw new Error('Please give a reason for declining.');
      log_(id, 'Landlord', 'Declined', note);
      touch_(req, STATUS.DECLINED);
      subject = 'Declined'; body = note;
    } else {
      throw new Error('Unknown action.');
    }
  } finally {
    lock.releaseLock();
  }
  notifyTenant_(mustFind_(id), subject, body);
  return detail_(id);
}

/* ------------------------------------------------------------------ */
/* Reminders                                                          */
/* ------------------------------------------------------------------ */

function sendReminders() {
  const c = config_();
  const days = Number(c.REMINDER_AFTER_DAYS) || 3;
  const now = new Date();
  allRequests_().forEach(function (r) {
    if (r.status !== STATUS.SUBMITTED) return;
    const since = r.lastReminder ? new Date(r.lastReminder) : new Date(r.created);
    if ((now - since) / 86400000 < days) return;
    sendMail_(c.LANDLORD_EMAIL,
      'Reminder: ' + r.id + ' ' + r.title + ' awaiting acknowledgment',
      emailHtml_(r, 'This request has not been acknowledged yet. Please open it to respond.',
        null, landlordLink_(r), 'Open request'), null);
    sheet_(SHEET_REQUESTS).getRange(r.row, REQUEST_HEADERS.indexOf('Last reminder') + 1).setValue(now);
    log_(r.id, 'System', 'Reminder sent to landlord', '');
  });
}

/* ------------------------------------------------------------------ */
/* Email                                                              */
/* ------------------------------------------------------------------ */

function notifyLandlordNew_(req, files) {
  const c = config_();
  const attachments = [];
  files.forEach(function (f) { if (f.blob) attachments.push(f.blob); });
  sendMail_(c.LANDLORD_EMAIL,
    'New work request ' + req.id + ': ' + req.title + ' (' + shortPriority_(req.priority) + ')',
    emailHtml_(req, 'A new work request has been submitted for ' + c.PROPERTY_NAME + '.',
      'Requested response: ' + responseTime_(req.priority) + '.',
      landlordLink_(req), 'View and respond'),
    attachments);
}

function notifyLandlordUpdate_(req, heading, note) {
  sendMail_(config_().LANDLORD_EMAIL, req.id + ' ' + req.title + ': ' + heading,
    emailHtml_(req, heading, note, landlordLink_(req), 'View request'), null);
}

function notifyTenant_(req, heading, note) {
  const c = config_();
  sendMail_(c.TENANT_EMAIL, req.id + ' ' + req.title + ': ' + heading,
    emailHtml_(req, heading, note, c.WEB_APP_URL + '?k=' + c.TENANT_KEY, 'Open tracker'), null);
}

function sendMail_(to, subject, html, attachments) {
  if (!to) return;
  const c = config_();
  const opts = {
    name: c.PROPERTY_NAME + ' Work Requests',
    htmlBody: html,
    replyTo: Session.getEffectiveUser().getEmail()
  };
  if (attachments && attachments.length) opts.attachments = attachments;
  MailApp.sendEmail(to, '[' + c.PROPERTY_NAME + '] ' + subject, stripHtml_(html), opts);
}

function emailHtml_(req, heading, note, link, buttonLabel) {
  const rows = [
    ['Request', req.id + ': ' + req.title],
    ['Status', req.status + (req.scheduledFor ? ' (' + req.scheduledFor + ')' : '')],
    ['Category', req.category],
    ['Priority', req.priority],
    ['Location', req.location || '–'],
    ['Description', req.description],
    ['Access notes', req.access || '–']
  ];
  return '<div style="font-family:Arial,sans-serif;max-width:560px;color:#1f2933">' +
    '<h2 style="font-size:18px;margin:0 0 8px">' + esc_(heading) + '</h2>' +
    (note ? '<p style="white-space:pre-wrap;margin:0 0 16px">' + esc_(note) + '</p>' : '') +
    '<table style="border-collapse:collapse;font-size:14px;width:100%">' +
    rows.map(function (r) {
      return '<tr><td style="padding:6px 8px;color:#52606d;vertical-align:top;width:120px">' + esc_(r[0]) +
        '</td><td style="padding:6px 8px;white-space:pre-wrap">' + esc_(r[1]) + '</td></tr>';
    }).join('') + '</table>' +
    (link ? '<p style="margin:20px 0"><a href="' + esc_(link) + '" style="background:#2f5d62;color:#fff;' +
      'padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block">' + esc_(buttonLabel) +
      '</a></p>' : '') +
    '<p style="font-size:12px;color:#7b8794">All updates on this request are time-stamped and recorded in the tracker. ' +
    'Please respond through the link above rather than by text, so both parties keep the same record.</p></div>';
}

/* ------------------------------------------------------------------ */
/* Data helpers                                                       */
/* ------------------------------------------------------------------ */

function allRequests_() {
  const sheet = sheet_(SHEET_REQUESTS);
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const values = sheet.getRange(2, 1, last - 1, REQUEST_HEADERS.length).getValues();
  return values.map(function (v, i) { return rowToRequest_(v, i + 2); })
    .filter(function (r) { return r.id; })
    .reverse();
}

function rowToRequest_(v, row) {
  return {
    row: row, id: v[0], created: v[1], updated: v[2], title: v[3], category: v[4],
    priority: v[5], location: v[6], description: v[7], access: v[8],
    photos: String(v[9] || '').split('\n').filter(String), status: v[10],
    scheduledFor: v[11], token: v[12], lastReminder: v[13]
  };
}

function findRequest_(id) {
  const all = allRequests_();
  for (let i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}

function mustFind_(id) {
  const r = findRequest_(id);
  if (!r) throw new Error('Request not found.');
  return r;
}

function publicRequest_(r) {
  return {
    id: r.id, created: fmt_(r.created), updated: fmt_(r.updated), title: r.title,
    category: r.category, priority: r.priority, location: r.location,
    description: r.description, access: r.access, photos: r.photos, status: r.status,
    scheduledFor: r.scheduledFor, open: OPEN_STATUSES.indexOf(r.status) >= 0,
    responseTime: responseTime_(r.priority)
  };
}

function detail_(id) {
  const r = mustFind_(id);
  const out = publicRequest_(r);
  const sheet = sheet_(SHEET_LOG);
  const last = sheet.getLastRow();
  out.log = last < 2 ? [] : sheet.getRange(2, 1, last - 1, LOG_HEADERS.length).getValues()
    .filter(function (v) { return v[1] === id; })
    .map(function (v) { return { at: fmt_(v[0]), who: v[2], action: v[3], note: v[4] }; });
  return out;
}

function touch_(req, status, scheduledFor) {
  const sheet = sheet_(SHEET_REQUESTS);
  sheet.getRange(req.row, REQUEST_HEADERS.indexOf('Updated') + 1).setValue(new Date());
  if (status) sheet.getRange(req.row, REQUEST_HEADERS.indexOf('Status') + 1).setValue(status);
  if (scheduledFor !== undefined) {
    sheet.getRange(req.row, REQUEST_HEADERS.indexOf('Scheduled for') + 1).setValue(scheduledFor);
  }
}

function log_(id, who, action, note) {
  sheet_(SHEET_LOG).appendRow([new Date(), id, who, action, note || '']);
}

function nextId_(sheet) {
  const last = sheet.getLastRow();
  let max = 0;
  if (last >= 2) {
    sheet.getRange(2, 1, last - 1, 1).getValues().forEach(function (v) {
      const n = Number(String(v[0]).replace('WR-', ''));
      if (n > max) max = n;
    });
  }
  return 'WR-' + ('000' + (max + 1)).slice(-4);
}

/*
 * Photos use the Drive API with the narrow "drive.file" permission:
 * the app can only see and manage files and folders it created itself,
 * never anything else in the owner's Drive.
 */
function savePhotos_(id, photos) {
  const folderId = photoFolder_();
  const out = [];
  photos.slice(0, 5).forEach(function (p, i) {
    if (!p || !p.data) return;
    const bytes = Utilities.base64Decode(p.data);
    if (bytes.length > 8 * 1024 * 1024) return;
    const name = id + '-' + (i + 1) + '.jpg';
    const blob = Utilities.newBlob(bytes, p.mimeType || 'image/jpeg', name);
    const file = Drive.Files.create({ name: name, parents: [folderId] }, blob,
      { fields: 'id,webViewLink' });
    try {
      Drive.Permissions.create({ role: 'reader', type: 'anyone' }, file.id);
    } catch (e) { /* link sharing may be restricted by Workspace policy */ }
    out.push({ url: file.webViewLink, blob: blob });
  });
  return out;
}

function photoFolder_() {
  const props = PropertiesService.getScriptProperties();
  // Keyed by spreadsheet so a copied tracker gets its own photo folder.
  const propKey = 'PHOTO_FOLDER_ID_' + SpreadsheetApp.getActive().getId();
  const fid = props.getProperty(propKey);
  if (fid) {
    try {
      const f = Drive.Files.get(fid, { fields: 'id,trashed' });
      if (!f.trashed) return f.id;
    } catch (e) { /* recreate */ }
  }
  const folder = Drive.Files.create({
    name: PHOTO_FOLDER_NAME + ' - ' + config_().PROPERTY_NAME,
    mimeType: 'application/vnd.google-apps.folder'
  }, null, { fields: 'id' });
  props.setProperty(propKey, folder.id);
  return folder.id;
}

/* ------------------------------------------------------------------ */
/* Config and security                                                */
/* ------------------------------------------------------------------ */

function readConfig_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_CONFIG);
  const out = {};
  if (!sheet || sheet.getLastRow() < 2) return out;
  sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues().forEach(function (v) {
    if (v[0]) out[String(v[0]).trim()] = String(v[1]).trim();
  });
  return out;
}

function config_() {
  const c = readConfig_();
  Object.keys(DEFAULT_CONFIG).forEach(function (k) { if (!(k in c)) c[k] = DEFAULT_CONFIG[k]; });
  return c;
}

function requireTenant_(key) {
  if (!key || !safeEqual_(key, config_().TENANT_KEY)) throw new Error('Link not valid.');
}

function requireLandlordToken_(id, token) {
  const r = findRequest_(id);
  if (!r || !token || !safeEqual_(token, r.token)) throw new Error('Link not valid.');
}

function landlordLink_(r) {
  return config_().WEB_APP_URL + '?r=' + encodeURIComponent(r.id) + '&t=' + r.token;
}

function newToken_() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
}

function safeEqual_(a, b) {
  a = String(a || ''); b = String(b || '');
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ------------------------------------------------------------------ */
/* Small utilities                                                    */
/* ------------------------------------------------------------------ */

function sheet_(name) {
  const s = SpreadsheetApp.getActive().getSheetByName(name);
  if (!s) throw new Error('Missing tab "' + name + '". Run setup() first.');
  return s;
}

function ensureSheet_(ss, name, headers) {
  let s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  if (s.getLastRow() === 0) {
    s.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    s.setFrozenRows(1);
  }
  return s;
}

function clean_(v, max) {
  return String(v == null ? '' : v).trim().slice(0, max || 1000);
}

function fmt_(d) {
  if (!d) return '';
  return Utilities.formatDate(new Date(d), Session.getScriptTimeZone(), 'MMM d, yyyy h:mm a');
}

function responseTime_(priority) {
  const c = config_();
  if (String(priority).indexOf('Urgent') === 0) return c.URGENT_RESPONSE;
  if (priority === 'Routine') return c.ROUTINE_RESPONSE;
  return c.STANDARD_RESPONSE;
}

function shortPriority_(p) {
  return String(p).split(' (')[0];
}

function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

function stripHtml_(html) {
  return String(html).replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|tr|h2)>/g, '\n')
    .replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n').trim();
}
