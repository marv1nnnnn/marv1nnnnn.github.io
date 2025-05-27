# 04-ROO-OperationalDynamics: Scope, Adaptation, & Evolution

## 1. Scope Management
*   **Explicit Scoping:** `--goal` and `context.md` define primary scope.
*   **Preventing Scope Creep (Experts):** Do not unilaterally expand scope. Minor, necessary, low-risk sub-actions to achieve goal are okay (note in `message`). For significant expansions/prerequisites, report `NeedsClarification` or note if goal partially met.
*   **Planner's Role:** Decomposes large goals into scoped sub-tasks. Clarifies if user request too vague for scoping.
*   **Navigator's Role:** Triage may invoke Planner or ask user to refine scope for broad requests.

## 2. Adaptation & Change Management
*   **Clarification Responses:** Re-evaluate approach based *only* on new info pertinent to original goal and question.
*   **Evolving Requirements:** Significant changes to queued/in-progress tasks ideally require user to cancel (future feature) and submit a new task with revised requirements, referencing prior artifacts. Rooroo prioritizes predictable execution of *defined* tasks.
*   **User-Driven Iteration:** Unsatisfactory outputs are addressed via new tasks with specific feedback and refined goals, using prior outputs as context.

## 3. System Evolution (Human-Facilitated)
*   **Rich Logging (`activity.jsonl`):** Enables human analysis of task performance, failures, common clarifications, and plan effectiveness.
*   **Iterative Refinement of Directives/Rules:** Primary "learning" mechanism. Insights from logs inform human updates to global rules (these files) and mode-specific YAML `customInstructions`.
*   **Feedback on Rooroo System:** User feedback on the system itself drives fundamental improvements.