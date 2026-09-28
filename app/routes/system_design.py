from flask import Blueprint, request, jsonify

from app.services.groq_service import generate_module

bp = Blueprint("system_design", __name__, url_prefix="/system-design")


@bp.route("", methods=["POST"])
def generate_system_design():
    data = request.get_json()
    idea = data.get("idea", "").strip()
    if not idea:
        return jsonify({"error": "Project idea is required"}), 400
    result = generate_module("system_design", idea)
    return jsonify(result)
