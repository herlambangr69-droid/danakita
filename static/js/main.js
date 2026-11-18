(function () {
  const money = n => new Intl.NumberFormat("id-ID", {style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
  function calculate(amount, tenor) { return Math.round((amount + amount * 0.01 * tenor) / tenor); }

  const range = document.getElementById("amountRange");
  const tenor = document.getElementById("tenorSelect");
  const amountLabel = document.getElementById("amountLabel");
  const monthlyLabel = document.getElementById("monthlyLabel");
  function updateLanding() {
    if (!range || !tenor) return;
    const amount = Number(range.value), months = Number(tenor.value);
    amountLabel.textContent = money(amount);
    monthlyLabel.textContent = money(calculate(amount, months));
  }
  if (range) { range.addEventListener("input", updateLanding); tenor.addEventListener("change", updateLanding); updateLanding(); }

  const loanAmount = document.getElementById("loanAmount");
  const loanTenor = document.getElementById("loanTenor");
  const formMonthly = document.getElementById("formMonthly");
  function updateForm() {
    if (!loanAmount || !loanTenor || !formMonthly) return;
    const amount = Math.max(0, Number(loanAmount.value) || 0);
    formMonthly.textContent = money(calculate(amount, Number(loanTenor.value)));
  }
  if (loanAmount) { loanAmount.addEventListener("input", updateForm); loanTenor.addEventListener("change", updateForm); updateForm(); }
})();
