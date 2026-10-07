# Website privacy, trust, and accessibility audit

Audited October 7, 2026. This records application behavior and remaining business decisions, not a certification of legal compliance.

| Item | Implementation / remaining action |
| --- | --- |
| 1. Privacy policy | `/privacy`; describes actual form fields, browser storage, internal alerts, retention, and privacy requests. |
| 2. Terms of service | `/terms`; no implied sale, financing approval, certification, or income guarantee. |
| 3. Refund policy | `/refunds`; request workflow and requirement for written order-specific terms. Owner must supply actual deposit, cancellation, return window, fee, custom-order, and processing rules. No terms were invented. |
| 4. Cookie policy | `/cookies`; only theme and notice choices, with accurate storage lifetime descriptions. |
| 5. Cookie banner | Equal choices to dismiss for the tab session or persist acknowledgement; settings available from footer. No optional trackers or deceptive “accept all” control. Neither choice enables tracking. |
| 6. Form consents | Unchecked adult and request-response consent controls in all forms and chat. API rejects missing, false, non-boolean, or obsolete consent; version and creation timestamp are retained. No marketing permission inferred. |
| 7. Data minimization | No DOB, government ID, financial account data, analytics IDs, or chat transcripts saved. Quote requires one contact method; chat email/city optional. API accepts email-only requests for all types. Twilio alerts contain only request type/reference. IP rate limiting is transient in memory, not saved to lead records. |
| 8. Third-party SDK audit | See inventory below; no client-side third-party requests required. Twilio is server-side, explicitly configured, and disabled by default. |
| 9. Dark patterns | Removed chat teaser, fake unread dot, human “online” implication, intro-session storage, unsubstantiated popularity labels, and hover-driven content changes. No marketing opt-in, forced tracker consent, countdown, or automatic purchase. |
| 10. Hidden fees | Starting-price and itemized-total disclosures in footer and price areas. Financing illustration excludes interest/fees explicitly; gross-rent illustration lists occupancy and cost assumptions. No checkout exists. Actual seller charges need written disclosure before an order. |
| 11. Fake reviews | No testimonials, review widgets, rating aggregates, or fabricated customer reviews found. No reviews added. Popularity assertions removed. |
| 12. Unsupported claims | Removed permit exemptions, pest-proof absolutes, immunity, no-credit promises, fastest/lowest-risk/popularity assertions, and automatic cargo-certification claims. Catalog specifications, indicative timings, provider availability, and photo provenance still need owner/manufacturer substantiation; visible quote-confirmation notice added. |
| 13. Alt text | Existing product images have alt attributes; decorative fallback uses empty alt. Gallery descriptions improved and dynamic office/build/size images update alt when selected. |
| 14. Contrast | Both palettes and key states checked with local axe-core; image-backed/translucent regions requiring manual review are recorded in `out/audit/accessibility.json`. Automated checks cannot certify every photo background or state. |
| 15. Keyboard | Skip link, visible focus, native form labels/checkboxes, selectable gallery figures, modal focus trap/return/inert background, menu Escape/focus handling, button state announcements, and a product-viewer motion pause control. |
| 16. Business details | `/business-details`, existing trade name, phone, email, service area. Owner must provide verified full legal seller name, postal address, and hours. |
| 17. Children's data | Adult-only inquiry controls and backend enforcement; no birthdate collected, no child enrollment or parental-consent claim. A checkbox is not verifiable parental consent. Any child-directed service requires a separate review/workflow before launch. |
| 18. Email unsubscribe | `/unsubscribe` provides a manual stop-contact request. No automated customer email sender exists. `docs/EMAIL_FOOTER.txt` supplies the link for human follow-up; postal address and any external mailing system need operator setup. No claim of automatic suppression. |
| 19. Font/image licensing | Fonts and Three.js self-hosted with upstream licenses. Photo rights were not supplied: `docs/IMAGE_RIGHTS.csv` inventories every asset for owner evidence; do not mark cleared without authorization. |
| 20. Data deletion | `/data-deletion` gives an email/phone request route; private CLI deletes after verification. Automatic 180-day cleanup at server startup and daily while running. Provider/correspondence/backup copies must be handled separately. |

## Third-party and storage inventory

| Component | Version / purpose | Data exposure and action |
| --- | --- | --- |
| Three.js | r128; existing 3D product viewer | Same-origin vendored script `/assets/vendor/three.min.js`; MIT license `/assets/licenses/three-LICENSE.txt`. No network/data collection by this integration. Pinned legacy version, not a claim it is current or vulnerability-free. |
| Archivo | Google Fonts distribution downloaded October 7, 2026 | Local TTF files; SIL Open Font License in `/assets/licenses/archivo-OFL.txt`. No runtime Google font requests. |
| Chakra Petch | Google Fonts distribution downloaded October 7, 2026 | Local TTF files; SIL OFL `/assets/licenses/chakrapetch-OFL.txt`. |
| IBM Plex Mono | Google Fonts distribution downloaded October 7, 2026 | Local TTF files; SIL OFL `/assets/licenses/ibmplexmono-OFL.txt`. |
| Twilio REST API | Existing server-side internal alert workflow | Off by default. Only request type/reference sent; no customer SMS. Credentials stay server-side. Account terms, retention, access, and provider deletion are operator responsibilities. |
| axe-core | 4.10.3; development accessibility checks | `tools/vendor/axe.min.js`, MPL 2.0 license supplied. Not served or loaded by the public website. |
| Theme | `yard-vault-theme` localStorage | Set on explicit theme selection; no contact data. |
| Privacy notice | `yard-vault-privacy` localStorage/sessionStorage | Version plus necessary-only acknowledgement, or tab-session dismissal. No optional tracking. |
| Analytics, ads, external AI, email SDK, review SDK, payment SDK | None found | No integrations or hidden SDK consent asserted. External destinations are normal user-initiated links. |

`public/assets/licenses/ASSET_HASHES.csv` records SHA-256 hashes for local fonts, vendor script, and their upstream license files.

## Privacy request operations

1. Monitor `info@myyardvault.com` and phone privacy/stop-contact requests. Confirm this mailbox is controlled by the business.
2. Verify requests through the email/phone already on file. A reference alone is insufficient; do not solicit identity documents by default.
3. Find the inquiry using `node tools/leads.js list` and, only where needed, `node tools/leads.js show <reference>`. These commands display private information; use only authorized local terminals.
4. For a verified deletion, run `node tools/leads.js delete <reference> --identity-verified`. This does not email the requester or access Twilio/CRM/backups. Process those copies separately and explain any legally required retention.
5. Record request completion without copying the deleted inquiry unnecessarily. Apply stop-contact requests to human workflows and any external mailing lists.
6. Server cleanup deletes new inquiry records marked with the 180-day policy by creation time. Pre-policy records without this marker are preserved for an operator's retention/legal review. Operators may also run `node tools/leads.js prune`. Confirm this retention period suits legal and order-record obligations before production.

## Owner information required

- Full legal business name, valid business postal address, hours, and monitored contact mailbox.
- Binding cancellation/refund/deposit/return/warranty terms and actual itemized charges.
- Manufacturer evidence for catalog specifications, indicative build times, certifications, and actual finance-provider availability.
- Copyright/permission evidence for every photograph, including rights to commercial use and any needed likeness/property permissions.
- Confirm the service is adult-facing. If children are intentionally served, do not repurpose these checkboxes as parental consent.

Guidance used: [FTC advertising substantiation](https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation), [FTC COPPA guidance](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions), [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [FTC CAN-SPAM business guidance](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business).
