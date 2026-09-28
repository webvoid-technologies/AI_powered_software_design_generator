from flask import Blueprint, request, jsonify

from app.services.groq_service import generate_module

bp = Blueprint("architecture", __name__, url_prefix="/architecture")


@bp.route("", methods=["POST"])
def generate_architecture():
    data = request.get_json()
    idea = data.get("idea", "").strip()
    if not idea:
        return jsonify({"error": "Project idea is required"}), 400
    result = generate_module("architecture", idea)
    return jsonify(result)
