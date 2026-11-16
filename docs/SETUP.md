# Setup and Testing Guide

*For Work Request Tracker v1.6.0. Every file carries its version in its first lines, and every page, dialog and email shows it, so you can confirm the live version matches the files you pasted.*

This guide takes you from nothing to a working, tested tracker. Each step lists **what to do**, **what you should see**, and **what to check** before moving on. Plan on 20 to 30 minutes, including testing.

**You'll need:** a Google account (personal Gmail or Google Workspace), a computer with a web browser, and the files from this repository.

**Two places you'll work in:**
- **The Google Sheet:** your data. Its tabs (**Requests**, **Log**, **Config**) are along the **bottom** of the Sheet.
- **The Apps Script editor:** the code. Open it from the Sheet with **Extensions > Apps Script**. It opens in a new browser tab.

---

## Part 1: Install

### Step 1. Create the Sheet
1. Go to [sheets.google.com](https://sheets.google.com) and create a **Blank** spreadsheet.
2. Click "Untitled spreadsheet" at the top left and name it, for example `Maple Lane Work Requests`.

**You should see:** an empty Sheet with one tab at the bottom named **Sheet1**.

### Step 2. Open the Apps Script editor
1. In the Sheet's menu, choose **Extensions > Apps Script**.
2. A new tab opens with a file named `Code.gs`.
3. Click **Untitled project** at the top left and rename it `Work Request Tracker`.

**You should see:** the editor, with **Files** listed on the left.

### Step 3. Add the code files
1. Click `Code.gs` on the left. Select everything in it (Cmd+A or Ctrl+A), delete it, and paste the entire contents of this repo's `Code.gs`.
2. Click the **+** next to **Files**, choose **HTML**, and type `Tenant` (no `.html`; the editor adds it). Paste the contents of `Tenant.html`.
3. Repeat for `Landlord`, `Styles` and `Shared`.
4. Click the **gear icon (Project Settings)** on the far left. Check **Show "appsscript.json" manifest file in editor**.
5. Click the **< > icon (Editor)** to return. Click `appsscript.json` and replace its contents with this repo's `appsscript.json`.
6. Click the **Save** icon (or Cmd+S / Ctrl+S).

**You should see:** six files on the left: `appsscript.json`, `Code.gs`, `Tenant.html`, `Landlord.html`, `Styles.html`, `Shared.html`. Under **Services**, **Drive** should appear (the manifest turns it on).

**Check:** names must match exactly, including capitalization. A file named `tenant` or `Tenant.html.html` will break the pages.

### Step 4. Run setup and grant permissions
1. At the top of the editor, find the function menu (it may say `myFunction`). Select **setup**.
2. Click **Run**.
3. Click **Review permissions** and choose your Google account.
4. If Google shows **"Google hasn't verified this app,"** click **Advanced**, then **Go to Work Request Tracker (unsafe)**. This is expected: it's your own script, not a published app.
5. Review the permissions and click **Allow**.

**You should see these permissions, and only these:**

| Google's wording | What it means |
| --- | --- |
| See, edit, create and delete only the specific Google Drive files you use with this app | Only the photo folder and photos the app creates |
| View and manage spreadsheets that this application has been installed in | Only this one Sheet |
| Send email as you | Notification emails |
| Allow this application to run when you are not present | The optional daily reminder |
| See your primary Google Account email address | Fills in your email on the Config tab |

> **Stop if** you see "See, edit, create, and delete **all** of your Google Drive files." That means the old manifest is still in place. Click **Cancel**, redo Step 3.5, and run setup again.

6. Below the code, the **Execution log** opens.

**You should see:** "Execution completed" and the message "Setup complete."

### Step 5. Fill in the Config tab
1. Return to the **Sheet** browser tab.
2. At the **bottom** of the Sheet, you should now see **Requests**, **Log** and **Config** tabs. (Sheet1 can be deleted.)
3. Click **Config**. Settings are in column A, values in column B. Fill in column B:

| Setting | What to enter | Example |
| --- | --- | --- |
| PROPERTY_NAME | Short property name, shown on pages and email subjects | 123 Maple Lane |
| TENANT_NAME | Your name | Jordan Lee |
| TENANT_EMAIL | Your email (filled in for you) | jordan@example.com |
| LANDLORD_NAME | Landlord or company name | Maple Properties LLC |
| LANDLORD_EMAIL | **Your own email for now**, for testing | jordan@example.com |
| URGENT_RESPONSE | Response time shown for urgent requests | within 24 hours |
| STANDARD_RESPONSE | Response time for standard requests | within 3 business days |
| ROUTINE_RESPONSE | Response time for routine requests | within 7 days |
| REMINDER_AFTER_DAYS | Days before an unacknowledged request triggers a reminder | 3 |
| WEB_APP_URL | Leave blank for now; filled in at Step 7 | |
| TENANT_KEY | **Do not change.** Generated automatically | (long code) |
| LANDLORD_KEY | **Do not change.** Generated automatically | (long code) |

**Check:** the keys are long random codes. If either is blank, run **setup** again.

### Step 6. Deploy as a web app
1. In the Apps Script editor, click **Deploy** (top right) > **New deployment**.
2. Click the **gear** next to "Select type" and choose **Web app**.
3. Description: `v1`.
4. **Execute as: Me** (your email).
5. **Who has access: Anyone.** This lets the landlord open links without an account. Security comes from the private keys in each link.
6. Click **Deploy**, approving permissions again if asked.
7. Copy the **Web app URL**. It ends in `/exec`.

> **If "Anyone" isn't offered:** your Google Workspace admin settings block public web apps. Either allow it in the Google Admin console, or set up the tracker from a personal Gmail account instead.

### Step 7. Save the URL and get your link
1. In the Sheet's **Config** tab, paste the URL into **WEB_APP_URL**.
2. In the Apps Script editor, select **showLinks** in the function menu and click **Run**.
3. In the **Execution log**, copy the line that starts "Your tenant link."
4. Open it in your browser and **bookmark it.**

**You should see:** a page headed "*Your property* · Work Requests," with the version (for example `Work Request Tracker v1.6.0`) at the bottom, with **Summary** and **All requests** tabs, a **+ New request** button, summary tiles (Open requests, Upcoming visits, Need your confirmation) and a calendar.

**Check:** the tenant link works like a password. Don't share it. If you open the bare URL without `?k=...`, you should see "This link is not valid," which confirms the protection is working.

### Step 8 (optional). Turn on daily reminders
Select **installReminderTrigger** and click **Run**. Each morning around 9 AM, the landlord gets one reminder for any request still "Submitted" after the number of days in REMINDER_AFTER_DAYS.

**Check:** the clock icon (**Triggers**) on the left lists `sendReminders`, set to run daily.

---

## Part 2: Test the full workflow

Run these tests with **LANDLORD_EMAIL set to your own email**, so you receive both sides of every message. Check off each result.

### Test 1: Submit a request (tenant)
1. Open your tenant link and click **+ New request**.
2. Fill in a title, category, priority, location, description and access notes. Attach one photo.
3. Click **Submit request**.

**Validate:**
- [ ] The page shows the request as **WR-0001**, status **Submitted**, with a "Submitted request" entry in History
- [ ] The **Requests** tab has one new row, and the **Log** tab has a "Submitted request" row
- [ ] Within a minute, an email arrives: **"[Property] New work request WR-0001: ..."** with the photo attached and a **View and respond** button
- [ ] In Google Drive, a folder named **"Work Request Photos - [Property]"** contains `WR-0001-1.jpg`

### Test 2: Respond as the landlord
1. In the email, click **View and respond**.

**Validate:**
- [ ] The page opens **without asking you to sign in** and shows the request details, the photo link and the history
- [ ] Clicking the photo link opens the image

2. Click **Acknowledge**.

**Validate:**
- [ ] The status changes to **Acknowledged**, and History shows the entry with a time stamp
- [ ] You receive an email: "WR-0001 ...: Acknowledged"

3. Click **Decline** with the message box empty.

**Validate:**
- [ ] It's blocked with "Please add a few details in the message box so the tenant understands." Nothing changes

4. In **Schedule a visit**, pick a date **less than 24 hours away** with **Specific time**, and click **Schedule visit**.

**Validate:**
- [ ] For an Interior request, it's blocked: "Interior visits need at least 24 hours' notice." (Exterior requests allow it)

5. Pick a date a few days out, choose **Afternoon**, and check the preview.

**Validate:**
- [ ] The preview shows the full day and date, for example "Will be sent as: Saturday, November 21, 2026, Afternoon, 12:00 PM to 4:00 PM"

6. Under **Who will be on site?**, choose **Contractor**. Fill in the company and contact person but leave the phone blank, and click **Schedule visit**.

**Validate:**
- [ ] For an Interior request, it's blocked: "For work inside the home, please add the phone."

7. Add a phone number, optionally some **Additional details**, and click **Schedule visit**.

**Validate:**
- [ ] The status changes to **Scheduled**, and the same text appears in a highlighted box
- [ ] You receive a "Scheduled for Saturday, November 21, ..." email that lists the contractor's company, contact and phone
- [ ] History shows the same visit details

### Test 3: Confirm, add to calendar, and request a change (tenant)
1. Open your tenant link. On **Summary**, check the tiles, **Needs your attention**, **Upcoming visits** and the **Calendar**.

**Validate:**
- [ ] "Need your confirmation" shows 1, and WR-0001 appears under **Needs your attention**
- [ ] The visit day is highlighted on the calendar; tapping it lists the visit, and tapping the visit opens it

2. Open WR-0001. In **Scheduled visit**, click **Add to Google Calendar**, then **Download .ics (Apple, Outlook)**.

**Validate:**
- [ ] Google Calendar opens a new event with the title, date, time and location filled in
- [ ] The .ics file downloads and opens in Apple Calendar or Outlook at the same time

3. Click **Confirm this time**.

**Validate:**
- [ ] The card shows "Confirmed" with a time stamp, and the Confirm button is gone
- [ ] History shows "Confirmed visit: ..." and the landlord email receives "Visit confirmed"

4. Click **Request a change**, leave the box empty and click **Send change request**. Then type a reason with times that work and send it.

**Validate:**
- [ ] The empty request is blocked
- [ ] The status changes to **Change requested**, the confirmation is cleared, and the landlord receives "Schedule change requested"

5. Type a comment under **Follow-up / Additional comment** and click **Send follow-up**.

**Validate:**
- [ ] History shows your message with a time stamp, and the landlord receives an email

### Test 3b: Respond to the change (landlord)
1. From the landlord link, open WR-0001.

**Validate:**
- [ ] The page shows **The tenant asked to change the visit** with the tenant's note, and a **Propose a new time** form. There is no separate "Schedule a visit" card

2. Choose a new date and time, fill in who is coming, and click **Send new time**.

**Validate:**
- [ ] The status returns to **Scheduled**, awaiting tenant confirmation, and the tenant receives the new time
- [ ] The card now shows **Scheduled visit** with **Add to Google Calendar**, **Download .ics** and **Request a change**. The schedule form is hidden

3. Click **Request a change**, pick another time, leave the reason empty and click **Send new time**. Then add a reason and send.

**Validate:**
- [ ] The empty reason is blocked: "Please explain the change so the tenant understands."
- [ ] History shows "Changed visit to: ..." with the reason, and the tenant must confirm again

4. Click **← All requests** at the top.

**Validate:**
- [ ] The overview opens with tiles, **Needs your response**, **Upcoming visits**, a **Calendar**, **Other open requests** and **Closed**

### Test 4: Complete and reopen
1. From the landlord link, click **Mark complete**.

**Validate:**
- [ ] The status is **Completed**, and the landlord page says no further action is needed
- [ ] On the tenant page, the request moves to the **Closed** tab

2. On the tenant page, open it, type "Still dripping," and click **Reopen (not resolved)**.

**Validate:**
- [ ] The status returns to **Submitted**, the request moves back to **Open**, and the landlord is emailed

### Test 5: Security checks
- [ ] Change one character in the landlord link's `t=` value and open it: it shows **"This link is not valid"**
- [ ] Submit a second request (WR-0002), then open WR-0001's landlord link with `r=WR-0002` swapped in: **not valid**. Each landlord link opens only its own request
- [ ] Open the web app URL with no parameters: **not valid**

### Test 6: Withdraw
On the tenant page, open WR-0002 and click **Withdraw request**.

**Validate:**
- [ ] The status is **Withdrawn**, the request moves to **Closed**, and the landlord is emailed

### Test 7 (optional): Reminder
1. In the **Requests** tab, change a Submitted request's **Created** date to a few days ago.
2. In Apps Script, run **sendReminders**.

**Validate:**
- [ ] The landlord email receives "Reminder: ... awaiting acknowledgment," and the Log shows "Reminder sent to landlord"
- [ ] Running it again the same day sends nothing more

---

## Part 3: Go live

1. **Clear the test data:** in the **Requests** and **Log** tabs, delete every row **except the header row** (row 1). In Drive, delete the test photos from the photo folder.
2. **Set the real landlord:** on the Config tab, change **LANDLORD_EMAIL** to the landlord's address.
3. **Optional overview link:** run **showLinks** again. The "Landlord overview link" lists all requests; send it only if the landlord wants it.
4. **Introduce it to the landlord** before the first request arrives. Explain that requests will come by email and they can respond with one click, with no account needed.
5. **Submit your first real request.**

---

## What to watch for

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Page loads, but the dropdown is empty or buttons do nothing (browser console shows "el is not defined") | `Shared.html` is missing, misnamed or has the wrong contents | Confirm a file named exactly `Shared.html` contains `<script>` and `function el(`; save and publish a new version |
| Only "Sheet1" at the bottom of the Sheet | Setup didn't run or failed | Run **setup** again and read the Execution log |
| "Missing tab..." error | Tabs renamed or deleted | Restore the original tab names, or run **setup** |
| Permission screen says "**all** of your Google Drive files" | Old manifest | Replace `appsscript.json`, then run setup again |
| "Anyone" not available in Deploy | Workspace admin policy | Allow it in the Admin console, or use a personal Gmail account |
| Links in emails are broken or blank | WEB_APP_URL empty or wrong | Paste the `/exec` URL into Config, then test again |
| "This link is not valid" on your own link | Missing or altered `?k=` key | Run **showLinks** and use that exact link |
| No emails arriving | Email typo, or spam folder | Check Config, then spam; mark as "Not spam" |
| Landlord can't open photos | Workspace restricts link sharing | Photos are still attached to the first email; or allow link sharing for the folder |
| Page shows old behavior after a code change (version at the bottom of the page is the old number) | Deployment not updated | **Deploy > Manage deployments > Edit > New version** |
| "Exceeded maximum execution time" or email quota error | Google's daily limits | Wait 24 hours. Gmail allows about 100 emails a day, Workspace about 1,500 |

## Upload the files instead of pasting (clasp)

The Apps Script editor has no upload button, but Google's command-line tool, **clasp**, uploads the files directly from your computer. It's the better route for updates: one command replaces every file. You need Node.js installed ([nodejs.org](https://nodejs.org), LTS version).

**One-time setup (Mac Terminal):**
1. Turn on the Apps Script API: go to [script.google.com/home/usersettings](https://script.google.com/home/usersettings) and switch **Google Apps Script API** to **On**.
2. Install clasp: `npm install -g @google/clasp`
3. Sign in: `clasp login`. A browser window opens; approve with the same Google account that owns the Sheet.
4. Get your Script ID: in the Apps Script editor, **Project Settings (gear) > IDs > Script ID > Copy**.
5. In Terminal, go to the unzipped project folder, for example `cd ~/Downloads/work-request-tracker`.
6. Link the folder to your project: `echo '{"scriptId":"PASTE_SCRIPT_ID","rootDir":"."}' > .clasp.json`

**Every upload:**
1. `clasp push` and answer **y** if it asks to overwrite the manifest. The included `.claspignore` uploads only the six app files.
2. Refresh the Apps Script editor to see the new files.
3. Publish: **Deploy > Manage deployments > Edit > New version > Deploy**.

**Check:** the bottom of your tenant page shows the new version number.

## Updating the code later
1. Paste the updated file(s) into the editor and save.
2. **Deploy > Manage deployments**, click the **pencil**, set **Version** to **New version**, and click **Deploy**.

The URL and all existing links keep working.

## Reusing for another property, client or vendor
1. In Google Drive, open the Sheet and choose **File > Make a copy**. The script copies with it.
2. In the copy's **Config** tab, **delete the rows** for TENANT_KEY, LANDLORD_KEY and WEB_APP_URL. Update the names and emails.
3. Open **Extensions > Apps Script** from the copy and run **setup**. It creates new keys and a new photo folder.
4. Deploy (Step 6), save the new URL (Step 7), and run the tests again.

## Backups and records
- The **Log** tab is the permanent, time-stamped record. Export it anytime with **File > Download > PDF or CSV**.
- Google Sheets keeps version history: **File > Version history**.
- Don't edit or delete Log rows. The Log's value as a record depends on it being complete.
