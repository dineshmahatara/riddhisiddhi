# Organization Savings System

A full-featured savings management web app for organizations, built with **Google Apps Script** and **Bootstrap 5**. Uses Google Sheets as the database — no external servers required.

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Total savings, monthly deposits/withdrawals, goal progress, top contributors |
| **Members** | Add/edit members with roles: Admin, Treasurer, Member |
| **Deposits** | Treasurers record member contributions with optional goal allocation |
| **Withdrawals** | Members request withdrawals; treasurers approve or reject |
| **Savings Goals** | Track pooled savings targets with progress bars |
| **Transactions** | Filterable history of all financial activity |
| **Statements** | Per-member balance summary and transaction list |
| **Settings** | Org name, currency, minimum withdrawal, auto-enroll |
| **Audit Log** | Full trail of administrative actions |

## Role Permissions

| Action | Member | Treasurer | Admin |
|--------|--------|-----------|-------|
| View own balance & statement | ✅ | ✅ | ✅ |
| Request withdrawal | ✅ | ✅ | ✅ |
| Record deposits | ❌ | ✅ | ✅ |
| Approve withdrawals | ❌ | ✅ | ✅ |
| Manage goals | ❌ | ✅ | ✅ |
| View all members | ❌ | ✅ | ✅ |
| Add/edit members | ❌ | ❌ | ✅ |
| Settings & audit log | ❌ | ❌ | ✅ |

## Quick Start

### 1. Create the Apps Script project

**Option A — clasp (recommended for developers)**

```bash
npm install -g @google/clasp
clasp login
clasp create --type webapp --title "Org Savings System"
clasp push
```

Update `.clasp.json` with your `scriptId` after creation.

**Option B — Manual**

1. Go to [script.google.com](https://script.google.com) → **New project**
2. Copy all **10 `.gs` files** into the script editor (one file per tab)
3. Create **3 HTML files** with these exact names (no `.html` extension in Apps Script):

| GitHub file | Apps Script tab name |
|-------------|----------------------|
| `Index.html` | `Index` |
| `Styles.html` | `Styles` |
| `AppScripts.html` | `AppScripts` |

4. Copy each file's contents into the matching tab
5. Save all files

> **All 3 HTML files are required.** `Index` loads `Styles` and `AppScripts` via `include()`.

### 2. Initialize the database

1. In the Apps Script editor, run `setupDatabase` (or `initializeDatabase`)
2. Authorize the script when prompted
3. A Google Sheet named **Org Savings Database** is created automatically
4. You are registered as the bootstrap **admin**

### 3. Deploy as web app

1. **Deploy** → **New deployment** → Type: **Web app**
2. Execute as: **Me**
3. Who has access: **Anyone** (for testing; tighten later if needed)
4. Copy the deployment URL (must end with `/exec`)

### 4. Add members

1. Open the web app URL while signed in as admin
2. Go to **Members** → **Add Member**
3. Enter each member's Google email and assign a role

> Members must sign in with the Google account matching their registered email.

## Project Structure

```
org-savings/
├── appsscript.json      # Apps Script manifest
├── Main.gs              # doGet, menu, setup
├── Config.gs            # Constants and sheet schemas
├── Database.gs          # Sheet CRUD and initialization
├── Auth.gs              # Google account auth & roles
├── Members.gs           # Member management
├── Goals.gs             # Savings goals
├── Transactions.gs      # Deposits & adjustments
├── Withdrawals.gs       # Withdrawal workflow
├── Reports.gs           # Dashboard & statements
├── Api.gs               # Client API router
├── Index.html           # Main page layout
├── Styles.html          # Custom CSS
└── AppScripts.html      # Client-side JavaScript
```

## GitHub + Apps Script workflow

1. Push this repo to GitHub (all `.gs` and `.html` files)
2. Clone or download from GitHub when you need to update Apps Script
3. Or use **clasp** to push directly from your local folder:

```bash
clasp push    # uploads all .gs and .html files to Apps Script
```

### HTML file mapping

| In GitHub | In Apps Script editor |
|-----------|----------------------|
| `Index.html` | Tab named `Index` |
| `Styles.html` | Tab named `Styles` |
| `AppScripts.html` | Tab named `AppScripts` |

## Google Sheets Schema

The system creates these sheets automatically:

- **Members** — user accounts, roles, balances
- **Transactions** — all financial records
- **WithdrawalRequests** — pending/approved/rejected requests
- **SavingsGoals** — organization savings targets
- **Settings** — key-value configuration
- **AuditLog** — administrative action trail

## Customization

Edit `Config.gs` to change:

- Default organization name and currency
- Sheet names
- Role definitions

Settings can also be changed at runtime from the **Settings** page (admin only).

## Security Notes

- Authentication uses `Session.getActiveUser()` — users must be signed into Google
- Deploy with **Execute as: Me** so the script can access the spreadsheet
- Restrict web app access to your organization's Google Workspace domain when possible
- The spreadsheet ID is stored in Script Properties after first run

## Development with clasp

```bash
clasp push          # Upload local changes
clasp pull          # Download remote changes
clasp open          # Open in browser editor
clasp deploy        # Create deployment
```

## License

MIT — use freely for your organization.
