
from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

def generate_flashcards(text):
    lines = text.strip().split("\n")
    flashcards = []

    for line in lines:
        if "-" not in line:
            continue
        q, a = line.split("-", 1)
        flashcards.append({"question": q.strip(), "answer": a.strip()})

    random.shuffle(flashcards)
    return flashcards

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    text = data.get("text", "")
    flashcards = generate_flashcards(text)
    return jsonify(flashcards)

if __name__ == "__main__":
    app.run(debug=True)