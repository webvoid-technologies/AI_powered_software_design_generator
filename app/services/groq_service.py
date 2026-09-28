import os
import re
from pathlib import Path

from groq import Groq

ROOT = Path(__file__).resolve().parent.parent.parent
PROMPTS_DIR = ROOT / "app" / "prompts"


def get_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY environment variable is not set")
    return Groq(api_key=api_key)


def load_prompt(module_name: str) -> str:
    prompt_path = PROMPTS_DIR / f"{module_name}.txt"
    if not prompt_path.exists():
        return ""
    return prompt_path.read_text(encoding="utf-8")


def extract_code_blocks(text: str) -> dict:
    """Extract fenced code blocks keyed by language hint."""
    pattern = re.compile(r"```(\w+)?\n(.*?)\n```", re.DOTALL)
    blocks = {}
    for match in pattern.finditer(text):
        lang = (match.group(1) or "text").lower()
        code = match.group(2).strip()
        if lang not in blocks:
            blocks[lang] = []
        blocks[lang].append(code)
    return blocks


def clean_markdown(text: str) -> str:
    """Remove fenced code blocks from markdown for plain rendering."""
    return re.sub(r"```[\s\S]*?```", "", text).strip()


def extract_mermaid_blocks(text: str) -> list:
    """Extract mermaid code blocks with the nearest preceding heading as title."""
    blocks = []
    pattern = re.compile(r"```mermaid\s*\n(.*?)```", re.DOTALL | re.IGNORECASE)
    for m in pattern.finditer(text):
        code = m.group(1).strip()
        if not code:
            continue
        headings = re.findall(r"^#{2,4}\s+(.+?)\s*$", text[: m.start()], re.MULTILINE)
        title = re.sub(r"[#*`]", "", headings[-1]).strip() if headings else None
        blocks.append({"title": title, "code": code})
    return blocks


def parse_response(content: str) -> dict:
    blocks = extract_code_blocks(content)
    mermaid_blocks = extract_mermaid_blocks(content)

    return {
        "overview": clean_markdown(content),
        "raw": content,
        "mermaid": "\n\n".join(b["code"] for b in mermaid_blocks) or "",
        "mermaid_blocks": mermaid_blocks,
        "plantuml": "\n\n".join(blocks.get("plantuml", [])) or "",
        "sql": "\n\n".join(blocks.get("sql", [])) or "",
        "json": "\n\n".join(blocks.get("json", [])) or "",
        "python": "\n\n".join(blocks.get("python", [])) or "",
    }


def generate_module(module_name: str, idea: str) -> dict:
    prompt_template = load_prompt(module_name)
    if not prompt_template:
        return {
            "error": f"Prompt template for '{module_name}' not found",
            "overview": "",
            "mermaid": "",
            "plantuml": "",
            "sql": "",
            "json": "",
            "raw": "",
        }

    system_prompt = (
        "You are an expert software architect and technical writer. "
        "Generate clear, well-structured software engineering artifacts. "
        "Always return Markdown with the requested fenced code blocks. "
        "Do not include explanations outside the requested sections. "
        "For Mermaid diagrams, keep node labels short and free of parentheses, "
        "slashes, colons, hash symbols, and quotes. If a label must contain "
        "special characters, wrap it in double quotes."
    )

    user_prompt = prompt_template.replace("{{IDEA}}", idea)

    try:
        client = get_client()
        model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.4,
            max_tokens=8192,
        )
        content = response.choices[0].message.content
        return parse_response(content)
    except RuntimeError as exc:
        return {"error": str(exc)}
    except Exception as exc:
        return {"error": f"Groq API error: {exc}"}
