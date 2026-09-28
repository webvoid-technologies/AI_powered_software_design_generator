from flask import Blueprint, request, jsonify

from app.services.groq_service import generate_module

bp = Blueprint("api_design", __name__, url_prefix="/api-design")


@bp.route("", methods=["POST"])
def generate_api_design():
    data = request.get_json()
    idea = data.get("idea", "").strip()
    if not idea:
        return jsonify({"error": "Project idea is required"}), 400
    result = generate_module("api_design", idea)
    return jsonify(result)
