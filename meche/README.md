# Calculus Connections Explorer — Mechanical Engineering (placeholder)

This folder is the **Mechanical Engineering** variant of the explorer. It uses the same calculus concept map topology as the main (CS) site (`graph_data_meche.json`), with ME courses and topics from `ME topic lists.csv` (Dynamics and Fluid Mechanics). Written rationales under each node’s `rationales` object are populated from `resources/MechE-Calc connections_030626/Dynamics-Calc-Table 1.csv` and `Fluids-Calc-Table 1.csv` (calculus topic → ME topic → rationale); keep these in sync when you update the CSVs.

- **Local:** open `index.html` from this folder, or serve the repo root and go to `/meche/`.
- **GitHub Pages:**  
  https://boxxelf.github.io/Calculus-Connections-Explorer-Update0215/meche/

To refresh rationales after editing the connection tables, merge the CSV rows into `graph_data_meche.json` again (each entry: `cs_topic` = ME topic name, `rationale` = text), matching calculus topics to node `label` values.
