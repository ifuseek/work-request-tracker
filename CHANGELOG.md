# Changelog

Each file carries its version inline (a comment at the top, and `APP_VERSION` in `Code.gs`). The version also shows at the bottom of every page, in the menu dialogs and in every email, so you can confirm which version is live. `appsscript.json` can't hold comments; it changes rarely and is noted below when it does.

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
