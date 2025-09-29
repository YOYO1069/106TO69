from flask import Blueprint, request, jsonify
from src.extensions import db
from src.models.event import Event
from datetime import datetime

event_bp = Blueprint("event", __name__)

@event_bp.route("/events", methods=["POST"])
def create_event():
    try:
        data = request.get_json()
        name = data.get("name")
        description = data.get("description", "")
        start_date = datetime.fromisoformat(data.get("start_date"))
        end_date = datetime.fromisoformat(data.get("end_date"))
        location = data.get("location", "")

        if not name or not start_date or not end_date:

            return jsonify({"error": "Missing required fields"}), 400

        event = Event(name=name, description=description, start_date=start_date, end_date=end_date, location=location, user_id=1, event_type="general", url="")
        db.session.add(event)
        db.session.commit()

        return jsonify({"success": True, "event": event.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@event_bp.route("/events", methods=["GET"])
def get_events():
    try:
        events = Event.query.all()
        return jsonify({"success": True, "events": [event.to_dict() for event in events]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@event_bp.route("/events/<int:event_id>", methods=["GET"])
def get_event(event_id):
    try:
        event = Event.query.get(event_id)
        if not event:
            return jsonify({"error": "Event not found"}), 404
        return jsonify({"success": True, "event": event.to_dict()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@event_bp.route("/events/<int:event_id>", methods=["PUT"])
def update_event(event_id):
    try:
        event = Event.query.get(event_id)
        if not event:
            return jsonify({"error": "Event not found"}), 404

        data = request.get_json()
        event.name = data.get("name", event.name)
        event.description = data.get("description", event.description)
        event.start_time = datetime.fromisoformat(data.get("start_time")) if data.get("start_time") else event.start_time
        event.end_time = datetime.fromisoformat(data.get("end_time")) if data.get("end_time") else event.end_time
        event.location = data.get("location", event.location)

        db.session.commit()
        return jsonify({"success": True, "event": event.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@event_bp.route("/events/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    try:
        event = Event.query.get(event_id)
        if not event:
            return jsonify({"error": "Event not found"}), 404

        db.session.delete(event)
        db.session.commit()
        return jsonify({"success": True, "message": "Event deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

