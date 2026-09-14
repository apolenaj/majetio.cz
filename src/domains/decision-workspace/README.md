# Decision Workspace — private notes, tasks, matrix

## Security

- `PropertyUserNote`, `PropertyDecisionTask`, `DecisionPreference` are **owner-only**
- Server actions always filter by `session.user.id`
- Note content is **never** in public DTOs, SEO/JSON-LD, or analytics events

## Models

| Model | Purpose |
|-------|---------|
| PropertyUserNote | Private note + quick tags per property |
| PropertyDecisionTask | Checklist (type, status, dueDate, suggested) |
| DecisionPreference | Matrix priorities JSON |
| Comparison.manualOrder | User ranking — automation must not overwrite |

## UI

- Detail `#rozhodnuti`: Moje poznámky + Checklist
- `/porovnani`: Note preview chips + DecisionMatrix (Match + breakdown + manual order)

## Checklist defaults

`suggestDecisionTasks` — e.g. high renovation risk → „Zajistit technickou prohlídku“, byt → SVJ.
