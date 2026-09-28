# AI-Powered Software Design and Diagram Generator

**Project Documentation — Final Year CSE Project (POC)**

---

## Table of Contents

1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
3. [Problem Statement](#3-problem-statement)
4. [Objectives](#4-objectives)
5. [Scope of the Project](#5-scope-of-the-project)
6. [Technology Stack](#6-technology-stack)
7. [System Architecture](#7-system-architecture)
8. [Module Descriptions](#8-module-descriptions)
9. [Request Flow](#9-request-flow)
10. [Prompt Engineering](#10-prompt-engineering)
11. [API Specification](#11-api-specification)
12. [User Interface Design](#12-user-interface-design)
13. [Response Parsing and Diagram Rendering](#13-response-parsing-and-diagram-rendering)
14. [Error Handling](#14-error-handling)
15. [Testing](#15-testing)
16. [Limitations](#16-limitations)
17. [Future Enhancements](#17-future-enhancements)
18. [Conclusion](#18-conclusion)
19. [References](#19-references)

---

## 1. Abstract

The AI-Powered Software Design and Diagram Generator is a full-stack Flask web application that converts a natural-language software project idea into a complete set of software engineering design artifacts. Given an input such as *"Build an Online Food Delivery System"*, the system produces a project mind map, UML diagrams (use case, class, sequence, activity, component), workflow flowcharts, an entity-relationship diagram, high-level system design, software architecture documentation, REST API specifications, and a SQL database schema.

The application uses the Groq inference API (running large language models such as GPT-OSS-120B, Llama 3.3, DeepSeek, or Qwen) for artifact generation. Diagrams are emitted as Mermaid and PlantUML source, rendered in the browser by Mermaid.js, while code artifacts are displayed with syntax highlighting and can be copied or downloaded.

## 2. Introduction

Software design is a critical early phase of the software development lifecycle. Before writing code, engineers produce mind maps, UML diagrams, ER diagrams, API contracts, and database schemas. This process is time-consuming and requires expertise in multiple notations and diagram tools.

Large Language Models (LLMs) can now draft these artifacts directly from a problem statement. This project demonstrates that a lightweight Flask backend, combined with a capable LLM and browser-based diagram rendering, can act as an "AI software design assistant" — accelerating the transition from an idea to a structured technical design.

The project is deliberately built as a **Flask-only POC**: no React, no database, no authentication, and no Docker, keeping the architecture easy to understand, demonstrate, and reproduce.

## 3. Problem Statement

Manually creating design documents and diagrams for a new software system requires:

- Deep knowledge of UML, ER modeling, and architectural patterns
- Familiarity with diagramming tools (draw.io, PlantUML editors, Lucidchart)
- Significant time for formatting, consistency, and iteration
- Separate effort for API contracts and database DDL

**Goal:** Accept a plain-English project description and automatically generate a coherent, consistent set of design artifacts — with rendered diagrams and downloadable source code — inside a single-page dashboard.

## 4. Objectives

- Accept a software project idea in natural language via a web UI.
- Generate eight categories of software engineering artifacts using an LLM.
- Render Mermaid diagrams (mind maps, flowcharts, ER, architecture) directly in the browser.
- Display PlantUML source, SQL DDL, and JSON API specifications with syntax highlighting.
- Provide copy and download actions for every generated artifact.
- Keep the codebase modular (Flask Blueprints, per-module prompts) so each generator is independently maintainable.

## 5. Scope of the Project

**In scope:**

- Eight AI generation modules sharing one backend service
- Mermaid.js rendering in the browser with syntax-error recovery
- PlantUML / SQL / JSON / Markdown source display and download
- Single-page dashboard, no persistence, no auth

**Out of scope (by design):**

- User accounts, history, or saved projects
- PlantUML image rendering (source text only; can be pasted into any PlantUML renderer)
- Multi-turn refinement / chat
- Production deployment hardening

## 6. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | Flask 3.1 (Python 3.9+) | HTTP API + template rendering |
| App structure | Flask Blueprints | One route file per AI module |
| AI inference | Groq API (`openai/gpt-oss-120b` default) | Artifact generation |
| Frontend | HTML5 + Tailwind CSS (CDN) | Responsive glassmorphism UI |
| Scripting | Vanilla JavaScript (Fetch API) | Async calls, DOM rendering |
| Templating | Jinja2 | Server-rendered `index.html` |
| Diagrams | Mermaid.js v10 | Browser-side diagram rendering |
| Highlighting | Prism.js | SQL / JSON / Python code blocks |
| Config | python-dotenv + `.env` | API key management |

**Why Groq:** Groq's LPU-based inference produces multi-thousand-token structured documents in seconds, which keeps the UI interactive even for eight large artifacts.

## 7. System Architecture

```
┌─────────────┐   fetch POST /{module}   ┌──────────────────────────────────┐
│   Browser   │ ───────────────────────► │           Flask Server           │
│  index.html │   JSON { idea }          │  app/app.py  (create_app)        │
│  app.js     │                          │        │                         │
│  Mermaid.js │                          │        ▼                         │
│  Prism.js   │ ◄─────────────────────── │  routes/<module>.py (Blueprint)  │
└─────────────┘   JSON { overview,       │        │                         │
       ▲            mermaid_blocks[],    │        ▼                         │
       │            plantuml, sql, json }│  services/groq_service.py        │
       └────────────────────────────────  │        │                         │
                                          │  prompts/<module>.txt          │
                                          └────────┬─────────────────────────┘
                                                   ▼
                                          Groq API (LLM chat completion)
```

**Key design decisions:**

- **Application factory** (`create_app()`) registers eight Blueprints; the root `app.py` is a thin entry point so `python app.py` works.
- **One service for all modules** — `generate_module(module_name, idea)` loads the module's prompt template, calls Groq, and parses the Markdown response.
- **Prompt templates as files** (`app/prompts/*.txt`) — prompt text is editable without touching Python code; `{{IDEA}}` is the injection placeholder.
- **Structured response contract** — every endpoint returns the same JSON shape (`overview`, `mermaid`, `mermaid_blocks`, `plantuml`, `sql`, `json`, `python`, `raw`), so the frontend renderer is module-agnostic.

## 8. Module Descriptions

| # | Module | Route file | Prompt | Output artifacts |
|---|--------|-----------|--------|------------------|
| 1 | AI Mind Map Generator | `routes/mindmap.py` | `prompts/mindmap.txt` | Overview + Mermaid `mindmap` |
| 2 | AI UML Diagram Generator | `routes/uml.py` | `prompts/uml.txt` | Use case, class (PlantUML), sequence, activity, component diagrams |
| 3 | AI Flowchart Generator | `routes/flowchart.py` | `prompts/flowchart.txt` | 4 labeled Mermaid flowcharts (user/admin/business/error) |
| 4 | AI ER Diagram Generator | `routes/er.py` | `prompts/er.txt` | Mermaid `erDiagram` + entity/relationship text |
| 5 | AI System Design Generator | `routes/system_design.py` | `prompts/system_design.txt` | Architecture explanation + Mermaid system diagram |
| 6 | AI Architecture Generator | `routes/architecture.py` | `prompts/architecture.txt` | Layered/MVC/microservice analysis + folder tree + deployment diagram |
| 7 | AI API Design Generator | `routes/api_design.py` | `prompts/api_design.txt` | Endpoint table + JSON request/response examples + OpenAPI stub |
| 8 | AI Database Schema Generator | `routes/database_schema.py` | `prompts/database_schema.txt` | `CREATE TABLE` DDL + visual schema cards + auto-built ER diagram |

Each route handler is intentionally identical in shape:

```python
@bp.route("", methods=["POST"])
def generate_xxx():
    idea = request.get_json().get("idea", "").strip()
    if not idea:
        return jsonify({"error": "Project idea is required"}), 400
    return jsonify(generate_module("xxx", idea))
```

## 9. Request Flow

1. User types a project description, picks a module (sidebar buttons or dropdown stay in sync), and clicks **Generate** (or `Ctrl+Enter`).
2. `app.js` POSTs `{ idea }` to the module endpoint.
3. The Blueprint validates input, then calls `generate_module()`.
4. `groq_service.py` loads `prompts/<module>.txt`, substitutes `{{IDEA}}`, and calls `client.chat.completions.create` (temperature `0.4`, max tokens `8192`).
5. The response Markdown is parsed: fenced code blocks are bucketed by language; each Mermaid block is paired with its nearest preceding `##` heading → `mermaid_blocks[]`.
6. The JSON response is rendered:
   - `overview` → Markdown→HTML (headings, lists, **tables**) in the Overview card.
   - `mermaid_blocks` → each rendered as its own titled diagram.
   - `sql` → additionally parsed client-side into **visual schema cards** (columns, types, PK/FK/UQ/NN badges) and a synthesized Mermaid `erDiagram` when no diagram was returned.
   - `plantuml`/`sql`/`json`/`raw` → tabbed code panels with Prism highlighting, Copy, and Download.

## 10. Prompt Engineering

Prompts live in `app/prompts/*.txt` and follow a consistent pattern:

- A `{{IDEA}}` placeholder at the top.
- Ordered `##` sections matching the module's requirements.
- An example fenced block showing the *exact* output format expected.

Two lessons learned during development are encoded in the prompts:

- **Mermaid label hygiene** — the system prompt and `mindmap.txt` forbid `()`, `/`, `:`, `#`, quotes in node labels (e.g. "NodeJS" not "Node.js"), because Mermaid v10 fails to parse them. The frontend additionally sanitizes labels as a safety net.
- **One fenced block per diagram** — multiple `mermaid` blocks must not be concatenated; the backend extracts each block individually so N diagrams render as N diagrams.

## 11. API Specification

All generation endpoints accept `Content-Type: application/json` and return `200` on success or `400`/`500` with `{ "error": "..." }`.

**Request body**

```json
{ "idea": "Build an Online Food Delivery System" }
```

**Response shape**

```json
{
  "overview": "markdown text without code fences",
  "raw": "complete markdown response",
  "mermaid": "all mermaid blocks joined",
  "mermaid_blocks": [{ "title": "User Flow", "code": "flowchart TD\n..." }],
  "plantuml": "@startuml ... @enduml",
  "sql": "CREATE TABLE ...",
  "json": "{ ... }",
  "python": "..."
}
```

## 12. User Interface Design

- **Layout:** fixed left sidebar (module nav) + scrollable main content column; collapses to stacked on mobile.
- **Styling:** blue/white glassmorphism (`backdrop-filter: blur`, translucent cards over a soft gradient).
- **Feedback:** spinner card during generation, red error card on failure, toast notifications for generate/copy/download.
- **Code UX:** tabbed panels per artifact type, Prism highlighting, per-tab Copy and Download (`.mmd`, `.puml`, `.sql`, `.json`, `.md`).
- **Schema UX:** SQL is parsed in the browser into per-table cards with key badges and a relationships strip; an ER diagram is synthesized if the model didn't emit one.

## 13. Response Parsing and Diagram Rendering

`app.js` implements a defensive rendering pipeline:

1. `mermaid.parse(code)` validates before touching the DOM.
2. On failure, `sanitizeMermaid(code)` repairs common LLM output mistakes — wraps mindmap nodes containing special characters as `id["label"]`, and quotes flowchart node/edge labels containing `/():;`.
3. If both attempts fail, a warning card with collapsible source is shown for that block only — one broken diagram never hides the others.
4. `buildErMermaid(tables)` synthesizes a valid `erDiagram` from parsed SQL (`type name PK/FK` attributes and `||--o{` relations), guaranteeing the Database Schema module always has a diagram.

## 14. Error Handling

| Layer | Behavior |
|-------|----------|
| Routes | `400` when `idea` is empty/missing |
| Service | Missing `GROQ_API_KEY` → `{error}`; Groq exceptions wrapped as `{error}` |
| Frontend | Non-200/error JSON → error card + toast; Mermaid failures → inline warning |
| Config | `.env` loaded from project root regardless of entry point |

## 15. Testing

Manual verification performed:

- `GET /` → 200, dashboard HTML with static assets resolving.
- `POST /mindmap` → valid `mindmap` Mermaid block (renders in browser).
- `POST /flowchart` → 4 titled `mermaid_blocks`.
- `POST /database-schema` → 20 `CREATE TABLE` statements → schema cards + synthesized ER.
- Missing API key → clean `"GROQ_API_KEY environment variable is not set"` error.
- Invalid model → surfaced Groq `model_not_found` message.

## 16. Limitations

- Output quality depends entirely on the LLM and prompt; artifacts need human review before real use.
- PlantUML is produced as source text only (no in-browser PlantUML rendering).
- No persistence — regenerating replaces previous output.
- Single-user POC; no rate limiting, caching, or auth.
- Free-tier Groq keys have restricted model access and rate limits.

## 17. Future Enhancements

- Server-side PlantUML rendering via the PlantUML web server.
- Export whole artifacts as a PDF/DOCX design document.
- Artifact editing + regeneration loops ("refine this sequence diagram").
- Project persistence (SQLite) and shareable links.
- Streaming responses (SSE) for progressive rendering.
- `git` repo scaffolding from the generated folder structure.

## 18. Conclusion

This POC demonstrates that an LLM, orchestrated by a thin Flask layer with disciplined prompting and robust client-side rendering, can automate a substantial portion of early-phase software design. The modular blueprint/prompt architecture makes each generator independently improvable, and the uniform JSON contract keeps the frontend generic across all eight modules.

## 19. References

- Flask documentation — https://flask.palletsprojects.com
- Groq API docs — https://console.groq.com/docs
- Mermaid.js — https://mermaid.js.org
- PlantUML — https://plantuml.com
- Tailwind CSS — https://tailwindcss.com
- Prism.js — https://prismjs.com
