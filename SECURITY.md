# Security Policy

## Threat model summary

dashAI's evidence is **tamper-evident**, not tamper-proof. The Ed25519 signature
proves a sealed payload has not been altered since the server sealed it; it does
**not** prove the camera witnessed physical reality (frames originate on the
client). See the README for the honest framing and the production hardening
roadmap (device attestation, GPS continuity, dedicated hardware).

### Key handling

- The signing private key lives only in `DASHAI_SIGNING_KEY` (server env). It is
  never sent to the client and never logged.
- The public key is intentionally published at `/api/public-key` so anyone can
  verify reports without trusting the dashAI UI.
- If `DASHAI_SIGNING_KEY` is unset, a DEV key is used and every artifact is
  labelled `dev-…`. Never run production without a real key.

## Reporting a vulnerability

Please open a private security advisory on the GitHub repository, or contact the
maintainers directly. Do not file public issues for sensitive vulnerabilities.
We aim to acknowledge reports within a few days.

## Privacy

dashAI performs face **detection** (to blur), never face **recognition**.
Evidence is stored locally (IndexedDB) by default; payloads reach the server
only when the user explicitly seals an event. This is aligned with the spirit of
Indonesia's UU No. 27/2022 (Pelindungan Data Pribadi).
