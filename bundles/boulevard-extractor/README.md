Boulevard Gift Card Extractor (Single Row)

What it does
- Logs into Boulevard dashboard, navigates: Sales → Gift cards.
- Opens the selected Purchasing Client’s profile to read email + phone.
- Opens the row menu → View History and extracts Date, Timestamp, Order Number, Where, Balance.
- Writes a CSV and a screenshot to `output/`.

Safety
- Read-only clicks only. It never clicks “Resend” or any message/outreach action.

Requirements
- Node.js 18+ installed
- Network access to download Playwright Chromium on first run

Setup
1) Install dependencies
   npm install

2) Install browser
   npm run install:browsers

Run
Set credentials as env vars (recommended) and run:

  BLVD_EMAIL="your@email" \
  BLVD_PASSWORD="your_password" \
  BLVD_TARGET_NAME="Exact Purchasing Client Name" \
  npm start

Environment variables
- `BLVD_EMAIL` (required): Boulevard login email
- `BLVD_PASSWORD` (required): Boulevard login password
- `BLVD_TARGET_NAME` (optional): Purchaser’s display name to match; if omitted the first row is used
- `BASE_URL` (optional): Defaults to `https://dashboard.boulevard.io`
- `LOGIN_PATH` (optional): Defaults to `/login-v2/`

Outputs
- `output/one_gift_card.csv` — columns: Purchasing Client, Client Email, Client Phone, Gift Card Code, Current Balance, Recipient, Recipient Email, Source, Status, Purchase Date, Purchase Time, Order Number, Where, History Balance
- `output/one_screenshot.png` — page context screenshot
- `output/one.har` — HAR capture

Notes
- If your organization enforces MFA or SSO, the script may need additional handling. This version assumes direct credential login.
- If the UI differs significantly, you may adjust selectors in `extract-one.mjs`.

