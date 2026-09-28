import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, render_template

# Load environment variables from .env in project root
root = Path(__file__).resolve().parent.parent
load_dotenv(root / ".env")

# Ensure project root is on path for imports
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

from app.routes import (
    mindmap,
    uml,
    flowchart,
    er,
    system_design,
    architecture,
    api_design,
    database_schema,
)


def create_app():
    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="static",
    )
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")

    app.register_blueprint(mindmap.bp)
    app.register_blueprint(uml.bp)
    app.register_blueprint(flowchart.bp)
    app.register_blueprint(er.bp)
    app.register_blueprint(system_design.bp)
    app.register_blueprint(architecture.bp)
    app.register_blueprint(api_design.bp)
    app.register_blueprint(database_schema.bp)

    @app.route("/")
    def index():
        return render_template("index.html")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
