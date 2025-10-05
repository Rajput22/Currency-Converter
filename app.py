from flask import Flask, session, redirect, Response, flash, url_for, render_template, request
import sqlite3
from database import init_db

app = Flask(__name__)

app.secret_key = "my_key"

def get_db_connection():
    conn = sqlite3.connect("users.db")
    conn.row_factory = sqlite3.Row
    return conn

@app.route("/")
def home():
    return redirect(url_for("login"))

@app.route("/login", methods=("POST", "GET"))
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE name=? AND password=?", (username, password))
        user = cur.fetchone()
        conn.close()

        if user:
            session["user"] = username
            return redirect(url_for("converter"))
        else:
            flash("IN-VALID CREDENTIALS, try agian", "error")
            return render_template("login.html")
    return render_template("login.html")

@app.route("/converter", methods=["GET","POST"])
def converter():
    if "user" not in session:
        return redirect(url_for("login"))
    
    if request.method == "POST":
        from_currency = request.form.get("from_currency")
        to_currency = request.form.get("to_currency")
        amount = float(request.form.get("amount"))
        result = float(request.form.get("result"))
        rate = float(request.form.get("rate"))

        # get logged-in user id
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE name=?", (session["user"],))
        user = cur.fetchone()

        if user:
                user_id = user["id"]
                cur.execute("""
                    INSERT INTO conversions (user_id, from_currency, to_currency, amount, result, rate)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (user_id, from_currency, to_currency, amount, result, rate))
                conn.commit()
                conn.close()

        return Response(status=204)

    return render_template("index.html")

@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name")
        email = request.form.get("email")
        password = request.form.get("password")

        conn = get_db_connection()
        cur = conn.cursor()
        try:
            cur.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", 
                        (name, email, password))
            conn.commit()
            flash("Registration successful! Please log in.", "success")
            return redirect(url_for("login"))
        except sqlite3.IntegrityError:
            flash("Email already registered!", "error")
            return render_template("register.html")
        finally:
            conn.close()

    return render_template("register.html")

@app.route("/history")
def history():
    if "user" not in session:
        return redirect(url_for("login"))

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT from_currency, to_currency, amount, result, rate, timestamp
        FROM conversions
        JOIN users ON conversions.user_id = users.id
        WHERE users.name=?
        ORDER BY timestamp DESC
    """, (session["user"],))
    records = cur.fetchall()
    conn.close()

    return render_template("history.html", records=records)


if __name__ == "__main__":
    init_db()
    app.run(debug=True)