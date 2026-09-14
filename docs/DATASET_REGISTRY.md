# Dataset Registry

Internal dataset catalog + quality scores + lineage. Spec **218–227**.

## Models

| Model | Role |
| --- | --- |
| `DatasetRegistry` | key, owner, steward, source, updateFrequency, quality SLA, `healthStatus` |
| `DatasetQualityScore` | score 0–100 + completeness / freshness / consistency / validity |
| `DatasetLineage` | upstream → downstream edges |

Health: `HEALTHY` | `STALE` | `DEGRADED` | `DISABLED`.

## API

`src/domains/administration/datasets/dataset-registry.ts`

- `listDatasets` / `upsertDataset` / `setDatasetHealth`
- `recordDatasetQualityScore` — may refresh health from SLA
- `addDatasetLineage` / `getDatasetLineageGraph`
- `deriveHealthFromSla` — pure helper (stale window + score floor)

## Metrics UI

Admin home internal tiles use **real** latest completeness averages — if no scores exist, empty state (no fake %).

## Rules

- Never invent completeness / error-rate samples.
- Disabled datasets excluded from operational averages.
- Health changes with reason when manually overridden.
