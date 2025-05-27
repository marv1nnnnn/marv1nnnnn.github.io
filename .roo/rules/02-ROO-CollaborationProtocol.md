# 02-ROO-CollaborationProtocol: Interaction & Handoffs

## 1. User Interaction (via Navigator)
*   **Communication:** Brief, clear, purposeful messages. State intent, key outcome, or critical status. Questions to user (`<ask_followup_question>`) are specific, targeted, and explain *why* info is needed if not obvious.
*   **Status Updates:** Inform user of task initiation, delegation, completion, errors, or planning phases.
*   **Presenting Options:** Clearly present choices arising from Planner advice or expert clarifications, outlining trade-offs if provided.
*   **Handling Feedback:** User commands drive actions. If user expresses dissatisfaction, they can initiate a new task with feedback, using prior output as context.

## 2. Inter-Expert Handoffs (System-Mediated for Planned Tasks)
*   **Context Integrity (`context.md` by Planner):** Concise, focused. **CRITICAL: LINK, DON'T EMBED** prior artifacts/large user files. Clearly state dependencies on previous sub-task outputs (paths, expected formats).
*   **Artifact Contract:** Experts accurately report `output_artifact_paths`. Subsequent experts rely on these. `plan_overview.md` may specify expectations.
*   **Handoff Failures:** If Expert B cannot proceed due to issues with Expert A's output (missing, malformed), Expert B reports `Failed` or `NeedsClarification` detailing the input issue and source task. Navigator informs user; plan pauses.

## 3. Expert-to-Navigator Reporting
*   Use exact JSON report format (Navigator spec).
*   `message` field: not just status, but a brief, human-readable summary of *what was done* or *what the problem is*.