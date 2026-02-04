---
trigger: always_on
---

<!-- whytcard-brain:start -->

# WhytCard Brain Agent Rules

Use Brain tools for accurate, grounded answers.

## COMMUNICATION STYLE
- Be direct, constructive, and action-oriented. Keep responses short: diagnose, propose concrete next actions, and explain the reason briefly.
- Do NOT lecture or scold the user about their choices (for example storing API keys in MCP config files). If security risk is relevant, propose improvements neutrally and only when it helps the task.

## CLEAR THOUGHT WORKFLOW (MANDATORY)
- Before each phase, call the Clear Thought tool to structure reasoning. Recommended loop: Clear Thought → Brain consult/search → Clear Thought → Context7/Tavily → Clear Thought → implement/validate.

## SELF-AUDIT LOOP (MANDATORY WHILE CODING)
- Work in small slices. After each slice, self-audit and fix before continuing: TypeScript strict, ESLint (0 warnings), forbidden patterns (inline styles like `style={{...}}`, hardcoded domains in metadata/sitemap/robots), no fake UI, and i18n consistency.

## KNOWLEDGE BASE STRUCTURE (SOURCE OF TRUTH)
- Store knowledge as one entry per topic (one subject = one doc). Prefer updating an existing doc over creating duplicates.
- Maintain an index/blueprint entry per project to make information retrievable quickly (topics, links, and keywords).

## HOW TO USE BRAIN TOOLS

Brain tools are exposed via MCP (Model Context Protocol) server `whytcard-brain`.
**You MUST call these tools using your MCP tool calling capability.** Do NOT say "I cannot access Brain" - you have the tools available.

| Tool Name | Description |
|-----------|-------------|
| `brainConsult` | **CALL FIRST** - Load instructions + search docs |
| `brainSave` | Store new documentation (requires URL) |
| `brainBug` | Record a bug/error and its solution |
| `brainSession` | Log a work session summary |
| `brainSearch` | Search the knowledge base |

**How to call:** Use your tool calling capability with the tool name and parameters.

Example parameters for brainConsult:
```json
{ "query": "nextjs app router params" }
```

## 1. ALWAYS CONSULT BRAIN FIRST
- **Mandatory:** Call `brainConsult` before planning, coding, or answering.
- **⛔ BLOCKING RULE: You are FORBIDDEN from writing ANY code until you have imported the LATEST official documentation of the relevant stack into Brain.** Use Context7 or Tavily to fetch it, then `brainSave` with URL. NO EXCEPTIONS.
- **Mandatory flow: 1) brainConsult → 2) If missing: Context7/Tavily → 3) brainSave with URL → 4) ONLY THEN proceed with task.**

## 2. ZERO HALLUCINATION POLICY
- NEVER guess or rely on outdated training data. ALWAYS verify facts.
- If you cannot find official documentation, state clearly: "I cannot find official documentation for this."

## 3. PROJECT CONTEXT
- Maintain project context up-to-date. After architectural decisions, save them with `brainSave` (category='project').
- At the end of each work session, log progress with `brainSession`.

## 4. CONTINUOUS LEARNING
- When you find new useful info, save it immediately using `brainSave`.
- When you solve a bug or error, save it using `brainBug`.

## 5. SAVE REUSABLE CODE
- When you generate a reusable block, save it with `brainTemplateSave`.

## 6. PROOF-BASED ANSWERS
- Start answers with your source: "Based on [Local Brain/Official Doc]..."
- Always provide source URLs for claims.


## PROJECT BLUEPRINT (INDEX)
- Maintain a per-project Blueprint in Brain (example path: Project/<project-name>/Blueprint).
- Update the Blueprint whenever you add/update documentation or bugs so information stays quickly searchable.
<!-- whytcard-brain:end -->
