# AI-Powered Software Design and Diagram Generator

A complete Flask-based Proof of Concept (POC) for a final-year CSE project that accepts a software project idea in natural language and automatically generates complete software engineering artifacts including mind maps, UML diagrams, flowcharts, ER diagrams, system architecture, API design, and database schema.

## Features

- **Module 1: AI Mind Map Generator** — Project idea breakdown as an interactive Mermaid mind map.
- **Module 2: AI UML Diagram Generator** — Use Case, Class, Sequence, Activity, and Component diagrams in PlantUML and Mermaid.
- **Module 3: AI Flowchart Generator** — User, admin, business, and error-handling flowcharts.
- **Module 4: AI ER Diagram Generator** — Entity Relationship diagrams with entities, attributes, keys, and relationships.
- **Module 5: AI System Design Generator** — High-level client-server design with architecture diagrams.
- **Module 6: AI Software Architecture Generator** — Layered, MVC, microservice, and deployment architecture.
- **Module 7: AI API Design Generator** — REST API documentation with endpoints, methods, bodies, and status codes.
- **Module 8: AI Database Schema Generator** — SQL CREATE TABLE statements with keys and relationships.

## Tech Stack

- Backend: Flask (Python)
- Frontend: HTML5, Tailwind CSS, Vanilla JavaScript
- Template Engine: Jinja2
- AI: Groq API (Llama 3.3 / DeepSeek / Qwen)
- Diagram Rendering: Mermaid.js, PlantUML text generation

## Project Structure

```
├── app.py                 # Entry point
├── app/
│   ├── __init__.py
│   ├── app.py             # Flask application factory
│   ├── routes/
│   │   ├── mindmap.py
│   │   ├── uml.py
│   │   ├── flowchart.py
│   │   ├── er.py
│   │   ├── system_design.py
│   │   ├── architecture.py
│   │   ├── api_design.py
│   │   └── database_schema.py
│   ├── services/
│   │   └── groq_service.py
│   ├── prompts/
│   │   ├── mindmap.txt
│   │   ├── uml.txt
│   │   ├── flowchart.txt
│   │   ├── er.txt
│   │   ├── system_design.txt
│   │   ├── architecture.txt
│   │   ├── api_design.txt
│   │   └── database_schema.txt
│   ├── templates/
│   │   └── index.html
│   └── static/
│       ├── css/
│       │   └── style.css
│       └── js/
│           └── app.js
├── requirements.txt
├── .env.example
└── README.md
```

## Prerequisites

- Python 3.9+
- pip
- A Groq API key from [https://console.groq.com](https://console.groq.com)

## Setup

1. Clone or extract the project, then open a terminal in the project folder.

2. Create and activate a virtual environment (recommended):

```bash
python3 -m venv venv
source venv/bin/activate          # macOS / Linux
venv\Scripts\activate             # Windows
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your Groq API key:

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

The default model is `openai/gpt-oss-120b`. To use a different Groq model your key has access to, set `GROQ_MODEL` in `.env`.

## Running the Application

```bash
python app.py
```

Then open [http://localhost:5000](http://localhost:5000) in your browser.

## Usage

1. Enter a project idea or problem statement in the textarea (e.g., "Build an Online Food Delivery System").
2. Select a module from the sidebar or dropdown.
3. Click **Generate**.
4. View rendered diagrams, copy code, or download Mermaid/PlantUML/SQL files.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Dashboard |
| `/mindmap` | POST | Generate Mermaid mind map |
| `/uml` | POST | Generate UML diagrams |
| `/flowchart` | POST | Generate flowchart |
| `/er` | POST | Generate ER diagram |
| `/system-design` | POST | Generate system design |
| `/architecture` | POST | Generate software architecture |
| `/api-design` | POST | Generate API design |
| `/database-schema` | POST | Generate SQL schema |

All endpoints accept JSON input: `{ "idea": "Your project idea" }`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `GROQ_API_KEY environment variable is not set` | Create `.env` from `.env.example` and add your key, then restart the server. |
| `model ... does not exist` | Your key can't access the default model. Set `GROQ_MODEL` in `.env` to a model listed by `GET https://api.groq.com/openai/v1/models`. |
| `python: command not found` | Use `python3` instead of `python`. |
| Blank diagrams | The AI returned invalid Mermaid syntax — click Generate again, or check the Mermaid code tab. |

## Notes

- No database, authentication, or Docker is used in this POC.
- All AI-generated content is produced via the Groq API.
- Ensure your Groq API key is valid and has sufficient quota.
