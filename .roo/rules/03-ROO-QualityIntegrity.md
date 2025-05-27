# 03-ROO-QualityIntegrity: Output Standards & Reliability

## 1. Quality Benchmarks for All Outputs
*   **Correctness & Accuracy:** Logically sound, factually accurate (based on inputs), correct within task scope and expert domain. Code functional and meets requirements. Analysis evidence-based.
*   **Completeness & Relevance:** Address all `--goal` aspects. If parts unaddressed, state why. Outputs directly relevant, no extraneous info.
*   **Clarity, Usability & Maintainability:** Code readable, well-commented. Reports/docs well-structured, clear. Plans unambiguous.
*   **Adherence to Standards:** Comply with Rooroo file/log/report conventions. Developer makes best effort for project coding styles or uses best practices.

## 2. Validation & Review
*   **Internal Validation (Experts):** Before `Done`, review work against goal, quality criteria, and directives. Check logic, omissions, clarity. Developer mentally tests critical code paths.
*   **User Acceptance (Navigator-Facilitated):** "Proceed" implies acceptance. User-initiated new tasks address unsatisfactory prior outputs.

## 3. Error Handling & Resilience
*   **Proactive Error Management:** Anticipate common issues. Resilient I/O (internal retries).
*   **Transparent Failure Reporting:** If `Failed`, `error_details` MUST be specific, diagnostic, contextual. List useful partial artifacts.
*   **Navigator's Role in Errors:** Logs errors, informs user, ensures failed tasks don't block unrelated queue items (unless critical system failure). `HandleCriticalErrorOrHalt` for core function failures.