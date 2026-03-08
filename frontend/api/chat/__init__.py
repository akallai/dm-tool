import json
import logging
import os

import azure.functions as func
import requests


def main(req: func.HttpRequest) -> func.HttpResponse:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return func.HttpResponse(
            json.dumps({"error": "OPENROUTER_API_KEY not configured"}),
            status_code=500,
            mimetype="application/json",
        )

    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"error": "Invalid JSON body"}),
            status_code=400,
            mimetype="application/json",
        )

    messages = body.get("messages")
    model = body.get("model")
    if not messages or not model:
        return func.HttpResponse(
            json.dumps({"error": "Missing required fields: messages, model"}),
            status_code=400,
            mimetype="application/json",
        )

    payload = {"model": model, "messages": messages}
    temperature = body.get("temperature")
    if temperature is not None:
        payload["temperature"] = temperature
    reasoning = body.get("reasoning")
    if reasoning is not None:
        payload["reasoning"] = reasoning

    try:
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=120,
        )
        return func.HttpResponse(
            resp.text,
            status_code=resp.status_code,
            mimetype="application/json",
        )
    except requests.RequestException as e:
        logging.error("OpenRouter request failed: %s", e)
        return func.HttpResponse(
            json.dumps({"error": "Failed to reach OpenRouter"}),
            status_code=502,
            mimetype="application/json",
        )
