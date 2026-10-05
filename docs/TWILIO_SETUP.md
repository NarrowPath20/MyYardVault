# Lead intake and Twilio groundwork

Quote requests, showroom requests, financing inquiries, and chat requests now submit to `POST /api/leads`. The server validates the fields, saves a private record, and returns a receipt. The browser shows success only after the server accepts the request.

The initial Twilio integration sends **internal sales-team lead alerts**. Customer follow-up texting can be added once the client's desired workflow is established. The customer's phone number is never used as the SMS destination by this implementation.

## Try it before the account exists

Run with Node.js 22.9 or newer:

```powershell
npm.cmd start
```

Without configuration, SMS is disabled. Submit a sample request at `/contact?panel=quote` or through chat; it is saved locally under `.data/leads/`. Each record includes a reference, normalized contact fields, request details, a received timestamp, and notification status. Leads and `.env` files are ignored by Git and are outside the public website directory.

Review saved records from the server's workspace:

```powershell
node tools/leads.js list
node tools/leads.js show YOUR-REQUEST-REFERENCE
```

`list` displays references, request types, and notification states. `show` displays the private contact details for a single record. There is no public endpoint for listing or retrieving leads.

Local mode captures requests but sends no notifications. Records collected before activation remain saved with notification state `disabled`; turning on Twilio does not automatically send that backlog.

## Configure the client's account later

Copy `.env.example` to `.env` and fill in:

| Setting | Value |
| --- | --- |
| `TWILIO_ACCOUNT_SID` | Client's account SID, beginning with `AC` |
| `TWILIO_AUTH_TOKEN` | Client's server-side authentication token |
| `TWILIO_FROM_NUMBER` | Client's Twilio sender in E.164 format, such as `+15055550101` |
| `TWILIO_MESSAGING_SERVICE_SID` | Optional `MG` service SID, used instead of the sender number |
| `LEAD_TEAM_PHONE` | Internal team recipient in E.164 format |
| `PUBLIC_BASE_URL` | Exact public HTTPS origin, such as `https://www.myyardvault.com` |
| `LEAD_DATA_DIR` | Persistent private directory; defaults to `.data/leads` |
| `TWILIO_NOTIFICATIONS_ENABLED` | Keep `false` until ready; explicitly set `true` to send alerts |

The server reads `.env` when started with `npm.cmd start`. Restart after configuration changes. An enabled configuration with missing or invalid settings fails at startup instead of silently dropping notifications. The browser receives none of these credentials.

Alerts use Twilio's [Messages API](https://www.twilio.com/docs/messaging/api/message-resource). Requests include the fixed team recipient, the configured sender or Messaging Service, a summary of the saved lead, and a delivery callback URL. Trial accounts require a verified recipient, as described in the same API documentation.

The callback URL is generated automatically:

```text
https://YOUR-PUBLIC-HOST/api/twilio/status?leadId=REQUEST-REFERENCE
```

It must be reachable from Twilio. The handler validates `X-Twilio-Signature` using the exact public URL, all submitted form parameters, and the account token, following [Twilio's request-validation algorithm](https://www.twilio.com/docs/usage/security). It checks the account and message association, records callbacks, deduplicates repeated events, and prevents late callbacks from regressing a completed delivery state.

## Failure handling

The lead is saved before an SMS is attempted. If Twilio rejects the request, the record retains state `failed`; a timeout or unclear response leaves it `unknown` because Twilio may have accepted it. A repeated browser submission with the same reference and contents reuses the existing lead without sending another alert. Reusing a reference with changed contents is rejected.

Inspect a failed record and the Twilio message status before taking action. To send an alert for a previously disabled or definitely failed notification, after enabling and configuring the account:

```powershell
node tools/leads.js retry YOUR-REQUEST-REFERENCE --send
```

This command sends a real SMS to the configured team number. It only retries disabled alerts or failures before Twilio assigned a message SID; it refuses notifications that already have a SID, pending requests, and uncertain outcomes. Customer-facing receipts mean the lead was saved; they do not claim an SMS was delivered.

## Application boundaries

| Module | Responsibility |
| --- | --- |
| `src/server/lead-model.js` | Field validation and phone normalization |
| `src/server/lead-store.js` | Private durable file storage and per-reference write serialization |
| `src/server/lead-api.js` | Intake, request limits, rate limits, and signed delivery callbacks |
| `src/server/twilio-service.js` | Twilio REST adapter and signature validation |
| `src/server/lead-notifications.js` | Notification dispatch and retained failure state |
| `src/models/lead-client.js` | Browser submission and stable retry references |
| `src/controllers/lead-forms-controller.js` | Form loading, success, and error states |

The file store is a foundation for one server process on a persistent disk. For a hosted deployment using ephemeral filesystems or multiple instances, replace `LeadStore` with the client's database/CRM adapter and use shared rate limiting. There is no automatic background delivery queue or lead-management dashboard in this phase. Backups, retention, and staff access to the private records belong to the deployment configuration.

The API caps requests at 16 KB, validates contact details and request types, applies a ten-request-per-IP limit per ten minutes, rejects cross-site browser submissions, and includes a hidden spam field. It uses the socket address for rate limiting and does not trust arbitrary forwarded-IP headers. If a reverse proxy is introduced, configure IP handling and shared limits for that host before enabling live notifications.

## Verification without live messaging

```powershell
npm.cmd test
node tools/browser-smoke.js
```

The tests use temporary lead directories and mocked Twilio responses. They cover validation, persistence, duplicate submissions, notification failures, callback signatures, out-of-order delivery events, form submissions, and chat lead capture. No test sends a real SMS.
