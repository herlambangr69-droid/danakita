import os
from datetime import datetime
from functools import wraps

from flask import Flask, render_template, request, redirect, url_for, flash, session, abort
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-only-change-this-secret-key")
database_url = os.environ.get("DATABASE_URL", "sqlite:///danakita.db")
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("COOKIE_SECURE", "0") == "1"
app.config["PERMANENT_SESSION_LIFETIME"] = 1800

db = SQLAlchemy(app)
csrf = CSRFProtect(app)
limiter = Limiter(get_remote_address, app=app, default_limits=["200 per day", "50 per hour"])

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    applications = db.relationship("LoanApplication", backref="user", lazy=True)

class LoanApplication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    tenor_months = db.Column(db.Integer, nullable=False)
    purpose = db.Column(db.String(250), nullable=False)
    monthly_estimate = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(30), default="Menunggu", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not session.get("user_id"):
            flash("Silakan masuk terlebih dahulu.", "warning")
            return redirect(url_for("login"))
        return view(*args, **kwargs)
    return wrapped

@app.context_processor
def inject_user():
    user = db.session.get(User, session.get("user_id")) if session.get("user_id") else None
    return {"current_user": user}

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/register", methods=["GET", "POST"])
@limiter.limit("5 per minute", methods=["POST"])
def register():
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        if len(name) < 2 or len(name) > 100:
            flash("Nama harus terdiri dari 2–100 karakter.", "danger")
        elif len(email) > 150 or "@" not in email:
            flash("Format email tidak valid.", "danger")
        elif len(password) < 10:
            flash("Password minimal 10 karakter.", "danger")
        elif User.query.filter_by(email=email).first():
            flash("Email sudah terdaftar. Silakan masuk.", "warning")
        else:
            user = User(name=name, email=email, password_hash=generate_password_hash(password))
            db.session.add(user)
            db.session.commit()
            session.clear()
            session["user_id"] = user.id
            session.permanent = True
            flash("Akun berhasil dibuat. Selamat datang di DanaKita Demo!", "success")
            return redirect(url_for("dashboard"))
    return render_template("auth.html", mode="register")

@app.route("/login", methods=["GET", "POST"])
@limiter.limit("5 per minute", methods=["POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            session.clear()
            session["user_id"] = user.id
            session.permanent = True
            flash("Berhasil masuk.", "success")
            return redirect(url_for("dashboard"))
        flash("Email atau password tidak sesuai.", "danger")
    return render_template("auth.html", mode="login")

@app.post("/logout")
@login_required
def logout():
    session.clear()
    flash("Kamu sudah keluar.", "success")
    return redirect(url_for("index"))

@app.route("/dashboard")
@login_required
def dashboard():
    user = db.session.get(User, session["user_id"])
    applications = LoanApplication.query.filter_by(user_id=user.id).order_by(LoanApplication.created_at.desc()).all()
    return render_template("dashboard.html", user=user, applications=applications)

@app.route("/ajukan", methods=["GET", "POST"])
@login_required
def apply_loan():
    if request.method == "POST":
        try:
            amount = int(request.form.get("amount", "0"))
            tenor = int(request.form.get("tenor", "0"))
        except ValueError:
            amount, tenor = 0, 0
        purpose = request.form.get("purpose", "").strip()
        if amount < 500000 or amount > 50000000:
            flash("Nominal simulasi harus antara Rp500.000 dan Rp50.000.000.", "danger")
        elif tenor not in [3, 6, 9, 12, 18, 24]:
            flash("Tenor tidak tersedia.", "danger")
        elif len(purpose) < 5 or len(purpose) > 250:
            flash("Tujuan pengajuan harus 5–250 karakter.", "danger")
        else:
            # Simulasi edukatif: bunga flat contoh 1% per bulan, bukan penawaran kredit.
            monthly = round((amount + (amount * 0.01 * tenor)) / tenor)
            application = LoanApplication(
                user_id=session["user_id"], amount=amount, tenor_months=tenor,
                purpose=purpose, monthly_estimate=monthly
            )
            db.session.add(application)
            db.session.commit()
            flash("Pengajuan demo berhasil dicatat. Ini bukan persetujuan atau pencairan pinjaman.", "success")
            return redirect(url_for("dashboard"))
    return render_template("apply.html")

@app.errorhandler(429)
def ratelimit_handler(error):
    return render_template("error.html", message="Terlalu banyak percobaan. Silakan coba lagi beberapa saat."), 429

@app.errorhandler(404)
def not_found(error):
    return render_template("error.html", message="Halaman tidak ditemukan."), 404

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG", "0") == "1")
