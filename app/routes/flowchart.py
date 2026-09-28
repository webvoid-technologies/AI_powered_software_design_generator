from flask import Blueprint, request, jsonify

from app.services.groq_service import generate_module

bp = Blueprint("flowchart", __name__, url_prefix="/flowchart")


@bp.route("", methods=["POST"])
def generate_flowchart():
    data = request.get_json()
    idea = data.get("idea", "").strip()
    if not idea:
        return jsonify({"error": "Project idea is required"}), 400
    result = generate_module("flowchart", idea)
    return jsonify(result)
