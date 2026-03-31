# Update Notes — March 20, 2026

This document summarizes changes made to **Calculus Connections Explorer** (Mechanical Engineering track) to align topic lists and in-app rationales with the **MechE–Calculus connection** tables dated **03/06/26** in `resources/MechE-Calc connections_030626/`.

---

## 1. ME topic lists (Dynamics & Fluid Mechanics)

**Files**

- `ME topic lists.csv` (repository root)
- `resources/MechE-Calc connections_030626/ME topic list-Table 1.csv`

**What changed**

- Topic rows were **regenerated** from the ME topic columns in:
  - `resources/MechE-Calc connections_030626/Dynamics-Calc-Table 1.csv` (column *Dynamics Topic*)
  - `resources/MechE-Calc connections_030626/Fluids-Calc-Table 1.csv` (column *Fluids Topic*)
- Topics are **unique per course**, in **first-appearance order** as they appear in those tables (so names stay consistent with the connection and rationale rows).
- **`Heat Transfer` was removed entirely** from the ME topic lists so the UI matches the current chart set (no Heat section in the new bundle).
- The sheet file `ME topic list-Table 1.csv` was previously empty; it now **mirrors** the root `ME topic lists.csv`. (The `resources/MechE-Calc connections_030626/*.csv` exports omit an Excel-style `Table 1` title row so each file is a single rectangular CSV for tools such as CSVLint.)
- CSV **quoting** is correct for topic names that contain commas (e.g. *Potentials, conservativation of energy, and momentum*).

**Course column values**

| Source file                         | `Course` value in lists |
|------------------------------------|-------------------------|
| Dynamics connection table          | `Dynamics`              |
| Fluids connection table            | `Fluid Mechanics`       |

---

## 2. Rationales in the MechE graph (`graph_data_meche.json`)

**What changed**

- Each node’s `rationales` object was **filled** from the two connection tables:
  - **Dynamics** → entries under `"Dynamics"`
  - **Fluids** → entries under `"Fluid Mechanics"`
- Each stored entry uses the same shape as the CS site: `{ "cs_topic": "<ME topic name>", "rationale": "<text>" }`  
  (`cs_topic` is the ME filter key expected by `meche/app-meche.js`.)
- Calculus topics in the CSVs were matched to graph nodes by **`label`** (with normalization of curly vs straight apostrophes only for matching).
- **`"Heat Transfer"` was removed** from `rationales` on every node so it matches the updated ME topic list.

**Counts (for verification)**

- **36** Dynamics rationale rows → **36** entries appended across nodes.
- **54** Fluids rationale rows → **54** entries appended across nodes.
- **65** nodes and **174** edges are **unchanged**; only `rationales` (and empty `cs_categories` formatting where rewritten) were updated.

---

## 3. Documentation

**File:** `meche/README.md`

- Updated to state that rationales come from the **Dynamics** and **Fluids** CSVs merged into `graph_data_meche.json`, and that ME topics are **Dynamics** and **Fluid Mechanics** only (no Heat Transfer in the current bundle).

---

## 4. What was *not* changed

- **Concept map topology** (nodes and edges) was not recomputed from the CSVs; it remains the existing calculus prerequisite graph in `graph_data_meche.json`.
- **`meche/app-meche.js`** was not modified; it already reads rationales from JSON and ME topics from `ME topic lists.csv`.

---

## 5. How to refresh data after future CSV edits

1. Update the connection tables in `resources/MechE-Calc connections_030626/`.
2. Rebuild `ME topic lists.csv` / `ME topic list-Table 1.csv` from the ME topic columns (same rules as above) if topic names change.
3. Re-merge rationale rows into `graph_data_meche.json` so `cs_topic` strings **exactly match** the names in `ME topic lists.csv` (including punctuation and apostrophes).

---

*Prepared for internal tracking — March 20, 2026.*
