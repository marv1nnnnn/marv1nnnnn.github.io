---
id: "rooroo"
title: "rooroo (如如)"
subtitle: "Minimalist AI Orchestration with Specialist Agents"
date: "2025-04-24"
summary: "A minimalist AI orchestration framework for VS Code, featuring a Navigator-led workflow and a team of specialist agents for streamlined, reliable software development."
tags: ["vibe-coding","ai","orchestration","vscode","agents","productivity"]
---

**Source:** [rooroo](https://github.com/marv1nnnnn/rooroo)

`rooroo` is a **minimalist AI orchestration framework** for VS Code, designed to streamline software development using a team of specialized Rooroo agents. It emphasizes a clear, Navigator-led workflow, efficient task management, and robust communication, all while incorporating advanced prompting techniques for enhanced reliability.

---

## 🤔 The Philosophy: "rooroo (如如)" - Thusness

Inspired by Buddhist philosophy, "如如" (rú rú) or "Thusness" reflects the idea of an underlying, consistent nature. This informs `rooroo`'s minimalist approach, focusing on the essential, specialized role of each agent.

![如如](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQeUmsB4LIHLErFEbei5g8PfIFG-XQntgqLyA&s)

---

## ⚙️ Core Principles

- **Navigator-Led Orchestration:** The **🧭 Rooroo Navigator** is your central guide, managing task flows, user interactions, and expert agent coordination with concise communication.
- **Specialized Agent Team:** A lean team of focused AI agents:
    - **🗓️ Rooroo Planner:** Decomposes complex goals.
    - **🧑‍💻 Rooroo Developer:** Crafts code and UIs.
    - **📊 Rooroo Analyzer:** Investigates and delivers insights.
    - **✍️ Rooroo Documenter:** Creates clear documentation.
    - **💡 Rooroo Idea Sparker:** Acts as a Strategic Foresight Facilitator, guiding users through a structured process to explore problems, evaluate solutions, and produce a detailed **Handoff Document**. This document serves as a comprehensive blueprint, ready for delegation to execution agents. Its outputs are stored in `.rooroo/brainstorming/`.
- **Structured Workflow & Communication:**
    - **Task Management:** Uses `.rooroo/queue.jsonl` for pending tasks.
    - **Detailed Briefings:** Tasks are detailed in `.rooroo/tasks/TASK_ID/context.md`, prioritizing links over embedded content.
    - **Organized Artifacts:** Outputs are stored in `.rooroo/tasks/TASK_ID/`.
    - **Clear Reporting:** Agents use a structured JSON "Output Envelope" to report to the Navigator.
    - **Event Logging:** Key events are logged with severity in `.rooroo/logs/activity.jsonl`.
- **Key Operational Guidelines:**
    - **Minimalism & Specialization:** Focused roles for clarity.
    - **Concise Context (Link, Don't Embed):** Efficient briefings.
    - **Principle of Least Assumption:** Agents clarify ambiguities, don't guess.
    - **Consistent Task IDs:** `ROO#` prefixes for easy tracking.
    - **Cost-Effectiveness:** Uses appropriate LLM tiers per agent.
    - **Workspace-Relative Paths:** Simplifies file referencing.
    - **Customizable Agent Behavior (Optional):** Utilize the `.roo/rules/` directory for workspace-wide custom instructions to tailor agent behavior, aligning with Roo Code best practices for organization and potential performance improvements.

---

## 🚀 Quick Start & Core Workflow

1. **Setup:** Install [Roo Code VS Code extension](https://marketplace.visualstudio.com/items?itemName=RooVeterinaryInc.roo-cline).
    - Load your `.roomodes` file.
        - **For Roo Code v3.18.0 and later:** You can use the YAML format for `.roomodes`.
        - **For Roo Code versions earlier than v3.18.0:** You must use the JSON format for `.roomodes` (e.g., `.roomodes.json`).
    - Reload VS Code.
    - (Optional: For advanced customization, create a `.roo/rules/` directory and add custom instruction files to tailor agent behavior across your workspace.)
2. **Initiate:** Select **🧭 Rooroo Navigator** and state your goal.
3. **Navigator Triage:** The Navigator assesses your request:
    - For *complex/uncertain tasks*, it engages the **🗓️ Rooroo Planner** to break it down into sub-tasks with `context.md` briefings. These go into the `.rooroo/queue.jsonl`.
    - For *simple, clear single-expert tasks* (Developer, Analyzer, Documenter only), it prepares `context.md` and may execute directly or queue the task.
    - If *ambiguous*, it asks you for clarification.
4. **Execution:** The Navigator dispatches tasks from the queue to the assigned Rooroo expert. The expert uses its `context.md` and stores outputs in `.rooroo/tasks/TASK_ID/`.
5. **Reporting:** The expert returns a JSON **Output Envelope** (status, message, artifacts) to the Navigator.
6. **Processing & Iteration:** The Navigator parses the envelope:
    - `NeedsClarification`: Relays question to you.
    - `Done`/`Failed`: Logs event, updates queue, informs you. Auto-proceeds with plans if applicable.
7. **Monitor:** Track progress via `.rooroo/queue.jsonl` and `.rooroo/logs/activity.jsonl`.

*(Refer to the Workflow Diagram below for a visual representation.)*

---

## 🤖 The Agent Team at a Glance

Each Rooroo agent adheres to core principles like the **Principle of Least Assumption** and **Concise Context File Preparation** (linking over embedding).

- **🧭 Rooroo Navigator (⚡ Cheap/Fast Recommended):** Your primary interface. Manages interactions, triages tasks, dispatches from the queue, processes expert reports, and logs events. Prioritizes concise communication.
- **🗓️ Rooroo Planner (🧠 Smart/Expensive Recommended):** Decomposes complex goals into sub-tasks for the Developer, Analyzer, or Documenter. Creates their `context.md` briefings and can flag ambiguous expert choices for the Navigator to resolve.
- **🧑‍💻 Rooroo Developer (Custom / Varies):** Executes coding tasks based on `context.md`. Stores outputs in its task folder or modifies project files.
- **📊 Rooroo Analyzer (⚡ Cheap/Fast Recommended):** Performs analysis based on `context.md`. Generates reports in its task folder.
- **✍️ Rooroo Documenter (⚡ Cheap/Fast Recommended):** Creates/updates documentation based on `context.md`. Stores outputs in its task folder.
- **💡 Rooroo Idea Sparker (🧠 Smart/Expensive Recommended):** Acts as a Strategic Foresight Facilitator, guiding users through a structured process to explore problems, evaluate solutions, and produce a detailed **Handoff Document**. This document serves as a comprehensive blueprint, ready for delegation to execution agents. Its outputs are stored in `.rooroo/brainstorming/`.

*Balance LLM tiers per agent for optimal cost and capability.*

---

## 📁 Directory Structure at a Glance

`rooroo` uses a clear, workspace-relative structure under the `.rooroo/` directory for all its operations and artifacts.