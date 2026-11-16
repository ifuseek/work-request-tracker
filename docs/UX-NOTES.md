# UX Notes from First-Time Setup

Observations from setting the tracker up as a first-time Apps Script user, and how each was addressed.

| # | Observation | Status |
| --- | --- | --- |
| 1 | It wasn't clear where the Config tab is. It lives at the bottom of the Sheet, not in the script editor. | Addressed: the setup guide now explains both places; setup opens the Config tab automatically |
| 2 | Running a function takes two steps in the editor: choose it from a dropdown, then click Run. Choosing the option should be enough. | Addressed: a **Work Requests** menu in the Sheet runs each action in one click |
| 3 | Links appeared only in the execution log, which is hard to find. | Addressed: **Show my links** opens a pop-up with Copy and Open buttons |
| 4 | The Category dropdown could not be opened or used. | Addressed: categories and all choices are now written into the page by the server instead of built in the browser |
| 5 | Scheduling needs to know whether work is inside or outside. | Addressed: required **Interior / Exterior** choice; the landlord page adjusts its scheduling guidance |
| 6 | Requests need to say which building. | Addressed: required **Main house / Cottage / Grounds** choice, configurable on the Config tab (BUILDINGS) |
| 7 | Running setup left the editor's execution log spinning indefinitely. The script was waiting for an OK click on a pop-up in the Sheet's tab. | Fixed in v1.2.1: messages use a non-blocking pop-up, so actions finish immediately |
| 8 | No preview of photos after choosing them. | Added in v1.3.0: thumbnails with a remove button for each photo |
| 9 | "Respond" was the wrong label for the tenant's comment area, and "optional for some actions" was confusing. | Fixed in v1.3.1: renamed to Follow-up / Additional comment, with a plain note on when a comment is included or required |
| 10 | Scheduling was a free-text box. It needed a date picker, a separate timeframe, and the day of the week shown with the date. | Added in v1.4.0: date picker, Morning / Afternoon / Evening / specific time, and a preview such as "Saturday, November 21, 2026" |
| 11 | "Decline (reason required)" read as harsh. | Changed in v1.4.0: the button reads Decline and asks for a few details so the tenant understands |
| 12 | The tenant needs to know who is coming, especially when someone will enter the home. | Added in v1.5.0: "Who will be on site?" with required contact details for anyone entering the home, plus optional additional details |
| 13 | The tenant should confirm the scheduled date, and either side should be able to request a change. | Added in v1.6.0: **Confirm this time** and **Request a change** for the tenant; the landlord can **Request a change** with a required reason, or **Propose a new time** when the tenant asks |
| 14 | The landlord's scheduling form stayed open after a visit was scheduled, which was confusing. | Fixed in v1.6.0: once scheduled, the form is replaced by a **Scheduled visit** card; only Request a change reopens it |
| 15 | A summary page should show upcoming repairs more clearly. | Added in v1.6.0: summary tiles, Needs your attention, Upcoming visits with date boxes, and what is waiting |
| 16 | Both pages need a way to see all requests, and a calendar of upcoming repairs. | Added in v1.6.0: **All requests** tab (tenant), **← All requests** link and redesigned overview (landlord), and a month calendar highlighting visit days on both |
| 17 | Visits should be easy to add to a personal calendar. | Added in v1.6.0: **Add to Google Calendar** and **Download .ics** (Apple, Outlook) on every scheduled visit |
