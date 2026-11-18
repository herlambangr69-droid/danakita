const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat("id-ID", {style:"currency", currency:"IDR", maximumFractionDigits:0}).format(n);
const estimate = (amount, tenor) => Math.round((amount + amount * 0.01 * tenor) / tenor);
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
let currentUser = read("danakita_current_user", null);
let authMode = "register";

function notify(message, error=false) {
  $("notice").textContent = message;
  $("notice").classList.toggle("error", error);
  $("notice").classList.remove("hidden");
  setTimeout(() => $("notice").classList.add("hidden"), 3200);
}
function show(page) {
  ["homePage","authPage","dashboardPage","applyPage"].forEach(id => $(id).classList.add("hidden"));
  $(page).classList.remove("hidden");
  window.scrollTo({top:0, behavior:"smooth"});
  updateNav();
  if(page === "dashboardPage") renderDashboard();
}
function updateNav() {
  const logged = !!currentUser;
  $("navLogin").classList.toggle("hidden", logged);
  $("navRegister").classList.toggle("hidden", logged);
  $("navDashboard").classList.toggle("hidden", !logged);
  $("navLogout").classList.toggle("hidden", !logged);
}
function openAuth(mode) {
  authMode = mode;
  $("authTitle").textContent = mode === "register" ? "Buat akun demo" : "Masuk ke akun demo";
  $("authSubtitle").textContent = mode === "register" ? "Daftar untuk mencoba dashboard simulasi." : "Masuk menggunakan akun demo di browser ini.";
  $("nameField").classList.toggle("hidden", mode !== "register");
  $("nameInput").required = mode === "register";
  $("authSubmit").textContent = mode === "register" ? "Daftar akun demo" : "Masuk";
  $("switchText").textContent = mode === "register" ? "Sudah punya akun?" : "Belum punya akun?";
  $("switchAuth").textContent = mode === "register" ? "Masuk" : "Daftar";
  $("passwordInput").autocomplete = mode === "register" ? "new-password" : "current-password";
  $("authForm").reset();
  show("authPage");
}
function getUsers(){ return read("danakita_users", []); }
function getApps(){ return read("danakita_apps_" + (currentUser?.email || ""), []); }
function renderDashboard(){
  $("welcomeName").textContent = currentUser?.name || "Pengguna";
  const apps = getApps();
  $("applicationCount").textContent = `${apps.length} pengajuan`;
  $("applicationRows").innerHTML = apps.map(a => `<tr><td>${new Date(a.createdAt).toLocaleDateString("id-ID")}</td><td>${money(a.amount)}</td><td>${a.tenor} bulan</td><td>${money(a.monthly)}</td><td><span class="status">Demo</span></td></tr>`).join("");
  $("emptyState").classList.toggle("hidden", apps.length > 0);
  document.querySelector(".table-scroll").classList.toggle("hidden", apps.length === 0);
}
function updateCalculator(){
  const amount = Number($("amountRange").value), tenor = Number($("tenorSelect").value);
  $("amountLabel").textContent = money(amount);
  $("monthlyLabel").textContent = money(estimate(amount, tenor));
}
function updateApplyEstimate(){
  const amount = Number($("applyAmount").value || 0), tenor = Number($("applyTenor").value);
  $("applyEstimate").textContent = money(estimate(amount, tenor));
}
$("navLogin").onclick = () => openAuth("login");
$("navRegister").onclick = () => openAuth("register");
$("heroRegister").onclick = () => openAuth("register");
$("simApply").onclick = () => currentUser ? show("applyPage") : openAuth("register");
$("switchAuth").onclick = (e) => {e.preventDefault(); openAuth(authMode === "register" ? "login" : "register");};
$("backHome").onclick = (e) => {e.preventDefault(); show("homePage");};
$("navDashboard").onclick = () => show("dashboardPage");
$("navLogout").onclick = () => {currentUser=null; localStorage.removeItem("danakita_current_user"); notify("Kamu sudah keluar dari akun demo."); show("homePage");};
$("newApplication").onclick = () => show("applyPage");
$("emptyApply").onclick = () => show("applyPage");
$("backDashboard").onclick = (e) => {e.preventDefault(); show("dashboardPage");};
$("amountRange").addEventListener("input", updateCalculator);
$("tenorSelect").addEventListener("change", updateCalculator);
$("applyAmount").addEventListener("input", updateApplyEstimate);
$("applyTenor").addEventListener("change", updateApplyEstimate);
document.querySelectorAll("[data-scroll]").forEach(el => el.addEventListener("click", e => {
  e.preventDefault(); show("homePage"); setTimeout(() => $(el.dataset.scroll).scrollIntoView({behavior:"smooth"}), 80);
}));
document.querySelector(".brand").onclick = (e) => {e.preventDefault(); show("homePage");};
$("authForm").addEventListener("submit", e => {
  e.preventDefault();
  const email = $("emailInput").value.trim().toLowerCase();
  const password = $("passwordInput").value;
  const users = getUsers();
  if(authMode === "register"){
    const name = $("nameInput").value.trim();
    if(name.length < 2){notify("Nama minimal 2 karakter.", true); return;}
    if(password.length < 10){notify("Password demo minimal 10 karakter.", true); return;}
    if(users.some(u => u.email === email)){notify("Email demo sudah terdaftar. Silakan masuk.", true); return;}
    users.push({name,email,password}); save("danakita_users", users);
    currentUser = {name,email}; save("danakita_current_user", currentUser);
    notify("Akun demo berhasil dibuat."); show("dashboardPage");
  } else {
    const user = users.find(u => u.email === email && u.password === password);
    if(!user){notify("Email atau password demo tidak sesuai.", true); return;}
    currentUser = {name:user.name,email:user.email}; save("danakita_current_user", currentUser);
    notify("Berhasil masuk ke akun demo."); show("dashboardPage");
  }
});
$("applyForm").addEventListener("submit", e => {
  e.preventDefault();
  if(!currentUser){openAuth("login");return;}
  const amount = Number($("applyAmount").value), tenor = Number($("applyTenor").value), purpose = $("purposeInput").value.trim();
  if(amount < 500000 || amount > 50000000){notify("Nominal harus antara Rp500.000 dan Rp50.000.000.", true);return;}
  if(purpose.length < 5 || purpose.length > 250){notify("Tujuan simulasi harus 5–250 karakter.", true);return;}
  const apps = getApps();
  apps.unshift({amount,tenor,purpose,monthly:estimate(amount,tenor),createdAt:new Date().toISOString()});
  save("danakita_apps_" + currentUser.email, apps);
  $("applyForm").reset(); $("applyAmount").value=8000000; updateApplyEstimate();
  notify("Simulasi demo berhasil dicatat. Tidak ada pinjaman yang diproses.");
  show("dashboardPage");
});
updateCalculator(); updateApplyEstimate(); updateNav();
if(currentUser) show("dashboardPage");
