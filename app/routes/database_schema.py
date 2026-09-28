from flask import Blueprint, request, jsonify

from app.services.groq_service import generate_module

bp = Blueprint("database_schema", __name__, url_prefix="/database-schema")


@bp.route("", methods=["POST"])
def generate_database_schema():
    data = request.get_json()
    idea = data.get("idea", "").strip()
    if not idea:
        return jsonify({"error": "Project idea is required"}), 400
    result = generate_module("database_schema", idea)
    return jsonify(result)
