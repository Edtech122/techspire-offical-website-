from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Techspire Backend is Live 🚀"

@app.route("/contact", methods=["POST"])
def contact():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    message = data.get("message")

    # abhi sirf response (baad me DB/email add karenge)
    return jsonify({
        "status": "success",
        "message": "Message received",
        "data": data
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
