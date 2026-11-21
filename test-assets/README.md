# Test Assets & Demonstration Fixtures (`test-assets/`)

This directory is the single canonical source of test fixtures and demonstration documents for the GramSetu platform. All images depict genuine, realistic civil infrastructure and public works in semi-urban/rural India (Uttar Pradesh context).

## 1. Tender Documents for Intake Testing
| File | Subject | Details |
|---|---|---|
| `sample-road-repair-tender.pdf` | PMGSY Road Resurfacing NIT | Official Notice Inviting Tender issued by UP PWD Varanasi Division. Includes project scope (3.85 km road upgrade), budget (₹45,00,000), 180-day milestone timeline, and defect liability terms. |
| `sample-tender.pdf` | Alias for automated test suites | Identical copy of `sample-road-repair-tender.pdf`. |

## 2. Before & After Project Inspection Pairs (2 Images per Project)
| Project | Before Construction | After Construction / Verified | Description |
|---|---|---|---|
| **Project 1: PMGSY Rural Road Upgrade** | `project-1-road-before.jpg` | `project-1-road-after.jpg` | Damaged asphalt village link road with potholes vs. newly resurfaced bituminous road with white boundary line markings. |
| **Project 2: Government School Renovation** | `project-2-school-before.jpg` | `project-2-school-after.jpg` | Weathered primary school (Prathmik Vidyalaya) exterior before works vs. clean painted building with paved courtyard. |
| **Project 3: Village Water Pipeline Network** | `project-3-pipeline-before.jpg` | `project-3-pipeline-after.jpg` | Deep roadside pipe trench excavation with HDPE pipes vs. completed backfilled road margin with village community drinking water stand. |
| **Project 4: Primary Health Centre Construction** | `project-4-healthcentre-before.jpg` | `project-4-healthcentre-after.jpg` | Active clinic construction site (brick masonry, scaffolding, mixer) vs. completed, operational Primary Health Centre with ramp. |
| **Project 5: Bridge Rehabilitation Project** | `project-5-bridge-before.jpg` | `project-5-bridge-after.jpg` | Aging canal road bridge with cracked deck and spalling parapet vs. rehabilitated reinforced concrete bridge with painted safety barriers. |
| **Project 6: Smart Drainage Culvert Upgrade** | `project-6-drainage-before.jpg` | `project-6-drainage-after.jpg` | Eroded, muddy roadside drainage ditch with standing water vs. covered precast concrete box culvert forming a paved pedestrian curb. |

## 3. Citizen Defect Evidence Testing
| File | Defect Type | Description |
|---|---|---|
| `citizen-pothole.jpg` | Pothole | Severe asphalt crater on road carriageway for citizen complaint filing and YOLOv8 defect detection. |
| `citizen-surface-cracking.jpg` | Surface Cracking | Extensive alligator fatigue fractures on bitumen pavement for AI analysis. |

## 4. Test Compatibility Aliases
- `road-before.jpg`: Pointer to `project-1-road-before.jpg` for integration/E2E test runners.
- `road-after.jpg`: Pointer to `project-1-road-after.jpg` for integration/E2E test runners.

## 5. Frontend Serving Copy & Synchronization
The root `test-assets/` directory is the single authoritative canonical source for all demonstration and testing fixtures.
To allow Vite to serve these static assets during local development and production Vercel hosting at `/test-assets/<filename>`, an exact mirror is maintained in `client/public/test-assets/`.

To synchronize changes from canonical `test-assets/` to `client/public/test-assets/`:
```powershell
# Windows PowerShell
Copy-Item -Recurse -Force test-assets/* client/public/test-assets/
```
```bash
# Unix / POSIX
cp -r test-assets/* client/public/test-assets/
```
