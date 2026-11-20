# Demonstration Asset Library

This directory contains legally safe, synthetic, or openly licensed demonstration assets designed for testing, evaluating, and demonstrating the GramSetu platform.

## Asset Directory Structure

```
assets/
  branding/
    gramsetu-logo.svg          # Official vector brand mark
  samples/
    roadDamage/
      before/
        road-damage-pothole-01.jpg   # Road surface before repair (defects present)
      after/
        road-repaired-surface-01.jpg # Road surface after civil works completion
    tenderDocuments/
      sample-road-repair-tender.pdf  # Fictional demonstration public works tender PDF
    companies/
      synthetic_contractors.json    # Synthetic contractor performance profiles
  screenshots/                       # Running application captures and diagrams
```

## Legal & Compliance Notes
1. **Fictional Data**: All contractor profiles, tender documents, and citizen IDs in these demo samples are completely synthetic. They do not represent real proprietary corporate data, active government procurement bids, or personal citizen records.
2. **Deterministic Seeding**: Demonstration assets are mirrored in `server/data/seedDatabase.js` for seeding local development environments cleanly.
3. **Image Privacy**: Real images uploaded through the citizen portal have EXIF metadata stripped (`stripImageMetadata.js`) prior to processing.
