# MASTER PLAN: Figment Application

## Phase 1: Ideation (Product Management)
**Objective:** Supercharge the "See All" modal. As a user curating hundreds of media items into custom shelves, a raw grid dump is insufficient. The modal needs to evolve from a "viewer" into a strict "list management tool" without sacrificing the native iOS aesthetic.

### 1.1 The Divergent Brainstorm
1. **The "Minimum Viable" Version:** A raw grid that just dumps the array of items. 
2. **The "Native-Premium" Version (Chosen):** Brings powerful local utility natively into the modal. Introduces instant type-ahead filtering, stateful sorting, and beautiful zero-state (empty) handling, all wrapped in iOS fluid animations.
3. **The "Data-Driven" Version:** Includes ML-driven recommendations for this specific list based on the content's metadata. (Rejected for Scope: Too heavy for an iteration, requires backend vectoring).

### 1.2 The PRD (Product Requirements Document)
* **JTBD (Job To Be Done):** "When I open my massive 'Favorite Sci-Fi' list, I want to instantly find 'Dune' or sort them alphabetically so I can visually digest my collection."
* **MoSCoW Requirements:**
  * **MUST HAVE:** Local text-matching search for title/subtitle.
  * **MUST HAVE:** Sort toggles (Original Order, A-Z, Z-A).
  * **MUST HAVE:** Empty state when a search yields zero results.
  * **WON'T HAVE (This iteration):** Bulk deletion mode (too risky for a quick iteration, requires DB sync verification).
* **Telemetry:** We will add haptic feedback to the sorting toggles, ensuring every interaction feels physically responsive.

---

## Phase 2: Design (UI, UX, and Animation)
### 2.1 UI Component Architecture
* **Search Input:** A sticky secondary header exactly like iOS Mail or iOS Settings. Gray background (`tertiary-system-background`), rounded-xl, left-aligned search icon.
* **Sort Controls:** A compact, horizontal scrollable pill-list below the search bar, allowing users to tap and instantly swap `Original`, `A-Z`, and `Z-A`.
* **Zero-State Design:** When search fails, display a centered, muted icon with "No results for '[Query]'" to ensure the system status is always predictable.

### 2.2 Native iOS Layout & Ergonomics
* We will bind the secondary header to `sticky top-safe-top` but offset it by the primary header's height so they stack flawlessly without clipping or disappearing on scroll.
* The search input will use `type="search"` to native-trigger the iOS keyboard's "Search" return key.

---

## Phase 3: System Architecture (Performance & Safety)
### 3.1 Performance Optimization (Zero-Millisecond Mindset)
* **`useMemo` Driven State:** The core logic must never mutate the original `section.items`. Instead, a `processedItems` array will strictly rely on a dual-pass `useMemo` block that first filters via Regex/includes, then sorts. This executes locally in O(N log N) time, which for lists < 1000 items guarantees a 60FPS lock.

---

## Phase 4: Execution
I will update `SectionSeeAllModal.tsx` to implement these specifications.
