Changelog: Tasks feature updates

- Admin-only task manager: Only users with role "admin" or role === "1" can view/manage tasks.
- Tasks saved in localStorage key: userTasks
- Task object fields updated:
  - id
  - title
  - description
  - completed (boolean)
  - createdAt (display string)
  - lastUpdated (display string)
  - statusHistory: Array of {status: 'active'|'completed', updatedAt: display string}
- New features:
  - Click the round checkbox to toggle completion — update timestamp added to history.
  - "Update status" button opens an inline form (status + datetime) to set exact status/time.
  - "History" button shows status update history for a task (reverse chronological).
  - Only admin can add/delete/update tasks; non-admins see a message.

How to preview:
1. Start the frontend:
   cd frontend
   npm start
2. Make sure your logged in user (localStorage key "user") has role "admin" or "1".
3. Open the Tasks page and test add/toggle/update/delete flows.

Notes/next steps:
- Optionally persist to backend via existing API calls instead of localStorage.
- Add stricter permission checks on backend APIs so non-admins cannot modify tasks even if they craft requests.
