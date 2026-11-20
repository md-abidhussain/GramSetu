# Demonstration Asset Library

This directory contains legally safe, synthetic, and purpose-built demonstration assets for the GramSetu GovTech platform.

## Directory Structure & Asset Inventory

```
assets/
  branding/
    gramsetu-logo.svg               # Minimalist vector brand mark (road perspective & bridge deck)
  samples/
    companies/
      synthetic_contractors.json     # Synthetic contractor performance profiles & audit records
    roadDamage/
      pothole-severe.jpg             # High-resolution ground view of severe pothole on damaged road
      surface-cracking.jpg           # Macro view of extensive bituminous alligator pavement fractures
      road-repair-before.jpg         # Rural/semi-urban damaged road prior to municipal intervention
      road-repair-after.jpg          # Matching road segment freshly paved with dark asphalt and road markings
      construction-progress.jpg      # Active civil works: asphalt paver, compactor, gravel layers, and barriers
    tenderDocuments/
      sample-road-repair-tender.pdf  # Fictional public works procurement tender PDF for AI extraction
```

## Asset Compliance & Separation
- **Separation of Concerns**: Test fixtures for unit/E2E tests reside strictly in `test-assets/` and `client/test-results/`. Documentation captures reside strictly in `docs/screenshots/`.
- **Privacy & Safety**: No real personal citizen data, confidential procurement documents, or proprietary company records are included.
- **Before/After Pairing**: `road-repair-before.jpg` and `road-repair-after.jpg` represent visually meaningful paired states for civic verification audits.
