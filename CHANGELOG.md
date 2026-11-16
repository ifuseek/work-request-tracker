# Changelog

Each file carries its version inline (a comment at the top, and `APP_VERSION` in `Code.gs`). The version also shows at the bottom of every page, in the menu dialogs and in every email, so you can confirm which version is live. `appsscript.json` can't hold comments; it changes rarely and is noted below when it does.

## 1.7.1 (2026-11-16)

- **Code is managed in GitHub, never pasted.** GitHub Actions runs the tests on every push, uploads to Apps Script from `main` (test link), and promotes a version tag such as `v1.8.0` to the live web app without changing its URL
- `npm test`: a version-consistency check plus the server flow tests, now in `tests/`
- `npm run bump -- x.y.z`: moves every file to a new version and adds a CHANGELOG entry
- `npm run push` / `npm run release`: the same deploy from your own computer (optional)
- New guide: `docs/DEVELOPMENT.md`. `SETUP.md` now points there for updates
- App behavior is unchanged; `Code.gs` and the pages change only their version number

## 1.7.0 (2026-11-16)

- **Invite the landlord** (Work Requests > 3. Invite the landlord): previews an introduction email explaining how the tracker works, the requested response times, and a **View all requests** link, with an **About privacy** section. Add an optional personal note, send yourself a test copy, then send. Nothing is sent until you click Send. The invite is recorded in the Log
- **Reset landlord links** (Work Requests menu): issues a new overview key and a new link for every request, so any forwarded or exposed landlord link stops working. Then send a fresh invite
- Changed file: `Code.gs` (all files carry the new version number). `appsscript.json` is unchanged

## 1.6.0 (2026-11-17)

- **Tenant confirmation:** a scheduled visit shows **Confirm this time** and **Request a change** (a reason is required). A change request sets the status to **Change requested** and clears any confirmation
- **Landlord, once scheduled:** the scheduling form is replaced by a **Scheduled visit** card showing the confirmation status. Only **Request a change** reopens it, and a reason is required
- **Landlord, change requested:** shows the tenant's note and a **Propose a new time** form
- **Summary pages:** tenant Summary with tiles, Needs your attention, Upcoming visits and a calendar; tenant **All requests** tab (open and closed); landlord **← All requests** link and a redesigned overview (Needs your response, Upcoming visits, Calendar, Other open, Closed)
- **Calendar:** a month view on both pages that highlights visit days; tap a day to see and open its visits
- **Add to calendar:** Google Calendar link and a downloadable .ics file (Apple Calendar, Outlook) for each scheduled visit. The .ics link checks the tenant key or the request's landlord token
- New Requests column **Scheduled end** (added automatically on first run)
- Changed files: `Code.gs`, `Tenant.html`, `Landlord.html`, `Shared.html`, `Styles.html` (all files carry the new version number). `appsscript.json` is unchanged

## 1.5.0 (2026-11-16)

- Scheduling asks **Who will be on site?**: Landlord, Contractor, or Someone else
- Contractors and others must give contact details. For interior work (entering the home), company (for contractors), contact person and phone are required; email is optional
- Optional **Additional details** for the visit: work to be done, vehicle, access needs
- Visit details are saved in the history and included in the tenant's email
- Rules are enforced both on the page and on the server
- Changed files: `Landlord.html`, `Styles.html`, `Code.gs` (all files carry the new version number)

## 1.4.0 (2026-11-16)

- Landlord scheduling: a date picker and a separate time window (Morning, Afternoon, Evening or a specific time)
- The appointment is sent with the full day and date, for example "Saturday, November 21, 2026, Afternoon, 12:00 PM to 4:00 PM", with a live preview before sending
- Interior visits can't be scheduled less than 24 hours ahead; past times are blocked
- Scheduling now has its own "Schedule a visit" section
- Gentler decline wording: the button reads **Decline** and asks for a few details so the tenant understands
- Changed files: `Landlord.html`, `Styles.html`, `Code.gs` (all files carry the new version number)

## 1.3.1 (2026-11-16)

- Tenant request page: "Respond" renamed to **Follow-up / Additional comment**; the button now reads **Send follow-up**
- Clearer comment box: the placeholder no longer says "optional for some actions"; a short note under the buttons explains when a comment is included (confirming, withdrawing) or required (reopening)
- Changed file: `Tenant.html` (all files carry the new version number)

## 1.3.0 (2026-11-16)

- Photo previews on the new request form: thumbnails appear as photos are chosen, each with a remove button
- Photos can be added in several batches, up to 5; the picker turns off at 5 and a note explains if extras were skipped
- Changed files: `Tenant.html`, `Styles.html` (all files carry the new version number)

## 1.2.1 (2026-11-16)

- Fix: setup and other menu actions no longer hang. Messages use a non-blocking pop-up instead of an alert that paused the script until someone clicked OK in the Sheet
- No changes to the pages or the manifest; only `Code.gs` changed in behavior (all files carry the new version number)

## 1.2.0 (2026-11-16)

- Required **Where** choice (Main house, Cottage, Grounds), configurable on the Config tab (BUILDINGS)
- Required **Interior / Exterior** choice; landlord scheduling guidance adapts to it
- Fix: form choices are rendered on the server, so the category list works even if a helper file fails to load
- Version number inline in every file and shown on pages, dialogs and emails
- Troubleshooting entry for a missing or misnamed `Shared.html`

## 1.1.0 (2026-11-16)

- Least-privilege photo storage: `drive.file` permission only (manifest changed)
- **Work Requests** menu in the Sheet: set up, show links, reminders, all in one click
- Links shown in a dialog with Copy and Open buttons (manifest changed: `script.container.ui`)
- Complete setup and testing guide (`docs/SETUP.md`) and UX notes log

## 1.0.0 (2026-11-16)

First release.

- Tenant page: submit requests with photos, view history, message, confirm schedule, withdraw, reopen
- Landlord page with no login: acknowledge, schedule, update, complete, decline with required reason
- Optional landlord overview link
- Automatic email notifications both ways, with photos attached to new requests
- Time-stamped Log tab as the shared record
- Optional daily reminder for unacknowledged requests
- Config tab for reuse across properties, clients and vendors
