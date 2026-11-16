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
