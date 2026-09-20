# Release verification

Date: 2026-09-21. Candidate: 1.0.0.

- npm run verify: passed (upstream syntax/i18n/smoke tests and 12 bundle tests).
- Independent Chrome for Testing profile: extension loaded successfully.
- Selected public fixtures/bundle using the browser file chooser: nine body references plus cover ready, no page runtime errors.
- Existing-title and existing-cover replacement: unchecked by default.
- All HTTP requests blocked in the browser test. No authenticated X interaction tested here.
- Screenshot: images/local-bundle.png (public synthetic data only).
- Store submission: not performed, owner has no developer account yet.

The upstream branding/docs assertions were updated to check this fork's identity and attribution; functional upstream checks remain enabled. The source package excludes local profiles, customer files, credentials and private-article screenshots. A targeted string/credential-pattern scan found no matches; this is not a comprehensive security audit.

Known limits: folder selection is session-only; unsupported Markdown image syntax can fail closed; output styling follows X rather than arbitrary HTML; future X editor changes may require maintenance. Local validation is not proof of successful upload.
