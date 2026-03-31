# Update Notes: Calculus Concept Map - Topic Code Mapping Fixes

## Overview

This update addresses critical mapping issues where certain calculus topics were not correctly displaying their topic codes (e.g., Der15, Int4, Int10) in the visualization. The fixes ensure that all nodes properly map to their corresponding topic codes as defined in the `Calculus topic labeling scheme.csv` file.

## Node Connection Structure

The calculus concept map uses a directed graph structure where nodes represent calculus topics and edges represent prerequisite relationships. The connections follow a hierarchical flow:

### Main Flow Paths

1. **Limits → Derivatives → Applications**
   - `A` (Motivating calculus & limits) → `B` (Limit concept) → `C` (Graphical/numerical limits) → `D` (Limit laws) → `J` (Basic differentiation)
   - `H` (Derivative concept) → `I` (Derivative as function) → `J` (Basic rules)
   - `J` → `K` (Product/quotient), `L` (Trigonometric), `M` (Logarithmic/exponential), `O` (Chain rule)
   - `O` → `Q` (Extreme values), `R` (Concavity), `U` (Implicit differentiation)
   - `Q` → `X` (Optimization), `Y` (Mean value theorem), `Z` (Sketching/graphing)

2. **Derivatives → Integrals**
   - `N` (Applications of derivatives) → `AA` (Motivating integrals) → `AC` (Definite integrals)
   - `T` (Antiderivatives) → `AD` (Fundamental theorem), `AJ` (Substitution), `AK` (Exponential/logarithmic)
   - `AC` → `AD` (FTC), `AE` (Area between curves), `AF` (Volume), `AG` (Arc length), `AH` (Physical applications)

3. **Advanced Integration**
   - `AJ` (Substitution) → `AO` (Trigonometric substitutions), `AY` (Separable DE), `BA` (First-order linear DE)
   - `AN` (Trigonometric integrals) → `AO` (Trigonometric substitutions)
   - `AP` (Partial fractions) → `AQ` (General strategies)
   - `AQ` → `AR` (Tables/technology), `AS` (Improper), `AU` (Physics), `AV` (Economics)
   - `AS` → `AT` (Probability)

4. **Differential Equations**
   - `N` → `AW` (Introducing DE) → `AX` (Direction fields), `AY` (Separable), `BA` (First-order linear)
   - `AY` → `AZ` (Modeling with DE)

5. **Sequences and Series**
   - `BB` (Sequences) → `BC` (Series) → `BD` (Convergence/divergence)
   - `BD` → `BE` (Comparison tests), `BF` (Ratio/root tests), `BG` (Alternating), `BH` (Taylor series)
   - `BH` → `BI` (Power series)

6. **Parametric and Polar Coordinates**
   - `BK` (Polar coordinates) → `BL` (Area/arc length in polar), `BM` (Conic sections)
   - `BJ` (Parametric equations) → `BM` (Conic sections)

## Issues Identified

### Problem 1: Node Z (number_id 24) - Missing Der15 Mapping

**Node Details:**
- **Node ID:** Z
- **Number ID:** 24
- **Label:** "Sketching and graphing functions using information from derivatives"
- **Expected Topic Code:** Der15
- **Expected Topic Name:** "Sketching/graphing functions using information from derivatives"

**Issue:**
The node Z shared the same `number_id` (24) with node P (Linear approximation), but the special mapping function only handled node P, mapping it to Der11. Node Z was not being correctly mapped to Der15, causing it to either fall back to a default mapping or display incorrectly.

**Connection Context:**
- Node Z receives connections from:
  - `Q` (Extreme values)
  - `R` (The shape of graphs and concavity)

### Problem 2: Node AD (number_id 31) - Missing Int4 Mapping

**Node Details:**
- **Node ID:** AD
- **Number ID:** 31
- **Label:** "The fundamental theorem of calculus"
- **Expected Topic Code:** Int4
- **Expected Topic Name:** "The fundamental theorem of calculus (FTC)"

**Issue:**
Node AD was not included in the special mappings, and the label normalization process failed to match it with the CSV entry "The fundamental theorem of calculus (FTC)" due to the missing "(FTC)" suffix. This caused the node to display an incorrect or default topic code instead of Int4.

**Connection Context:**
- Node AD receives connections from:
  - `AC` (Definite integrals)
  - `T` (Antiderivatives)
- Node AD connects to:
  - `AI` (Indefinite integrals and the net change theorem)

### Problem 3: Node AH (number_id 41) - Missing Int10 Mapping

**Node Details:**
- **Node ID:** AH
- **Number ID:** 41
- **Label:** "Using integrals for physical applications"
- **Expected Topic Code:** Int10
- **Expected Topic Name:** "Using integrals for physical applications (work, force, density, mass, etc.)"

**Issue:**
Similar to node AD, node AH was missing from the special mappings. The label normalization failed because the graph_data.json label was shorter than the CSV entry, which includes the additional detail "(work, force, density, mass, etc.)". This prevented proper matching to Int10.

**Connection Context:**
- Node AH receives connections from:
  - `AC` (Definite integrals)
  - `AJ` (Integration with substitution rule)
  - `AK` (Integrals of exponential and logarithmic functions)

## Solutions Implemented

### Fix 1: Enhanced Special Mapping for number_id 24

**Location:** `app.js`, `getSpecialTopicMapping()` function

**Solution:**
Added conditional logic to handle the two nodes sharing `number_id` 24 by checking the node label:

```javascript
if (numberId === 24) {
    const labelLower = nodeLabel ? nodeLabel.toLowerCase() : '';
    if (labelLower.includes('sketching') || labelLower.includes('graphing')) {
        // Node Z: Sketching/graphing functions -> Der15
        return {
            topicCode: 'Der15',
            topicName: 'Sketching/graphing functions using information from derivatives',
            course: 'Calculus I',
            coreIdea: 'Derivatives'
        };
    } else {
        // Node P: Linear approximation -> Der11
        return {
            topicCode: 'Der11',
            topicName: 'Linear approximations',
            course: 'Calculus I',
            coreIdea: 'Derivatives'
        };
    }
}
```

**How it works:**
- When processing a node with `number_id` 24, the function first checks if the label contains "sketching" or "graphing"
- If found, it maps to Der15 (node Z)
- Otherwise, it maps to Der11 (node P)

### Fix 2: Added Special Mapping for number_id 31

**Location:** `app.js`, `getSpecialTopicMapping()` function, `specialMappings` object

**Solution:**
Added explicit mapping for number_id 31:

```javascript
31: { // The fundamental theorem of calculus -> Int4
    topicCode: 'Int4',
    topicName: 'The fundamental theorem of calculus (FTC)',
    course: 'Calculus I',
    coreIdea: 'Integrals'
}
```

**How it works:**
- When a node with `number_id` 31 is processed, it directly returns the Int4 mapping
- This bypasses the label normalization process that was failing due to label differences

### Fix 3: Added Special Mapping for number_id 41

**Location:** `app.js`, `getSpecialTopicMapping()` function, `specialMappings` object

**Solution:**
Added explicit mapping for number_id 41:

```javascript
41: { // Using integrals for physical applications -> Int10
    topicCode: 'Int10',
    topicName: 'Using integrals for physical applications (work, force, density, mass, etc.)',
    course: 'Calculus I',
    coreIdea: 'Integrals'
}
```

**How it works:**
- Similar to Fix 2, this provides a direct mapping for number_id 41 to Int10
- Ensures the full topic name from CSV is used, including the parenthetical details

## Verification

All fixes have been verified through automated testing:

- Node Z (number_id 24) correctly maps to Der15
- Node P (number_id 24) correctly maps to Der11
- Node AD (number_id 31) correctly maps to Int4
- Node AH (number_id 41) correctly maps to Int10

## Impact

These fixes ensure that:
1. All calculus topics display their correct topic codes in the visualization
2. The sidebar navigation correctly identifies and highlights topics
3. Topic filtering and searching work accurately
4. The relationship between graph nodes and CSV topic definitions is maintained
