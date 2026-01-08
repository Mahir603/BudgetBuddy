const STORAGE_KEY = "budgetbuddy_transactions_v1";

const form = document.getElementById("txForm");
const typeEl = document.getElementById("type");
const categoryEl = document.getElementById("category");
const amountEl = document.getElementById("amount");
const dateEl = document.getElementById("date");
const noteEl = document.getElementById("note");

const filterEl = document.getElementById("filter");
const txListEl = document.getElementById("txList");

const incomeTotalEl = document.getElementById("incomeTotal");
const expenseTotalEl = document.getElementById("expenseTotal");
const balanceTotalEl = document.getElementById("balanceTotal");

const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");

let transactions = load();

// zet default datum = vandaag
dateEl.valueAsDate = new Date();

function euro(n){
  return new Intl.NumberFormat("nl-NL", { style:"currency", currency:"EUR" }).format(n);
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch{
    return [];
  }
}

function uid(){
  // simple unique id
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

function totals(){
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((s,t)=> s + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === "expense")
    .reduce((s,t)=> s + t.amount, 0);

  return { income, expense, balance: income - expense };
}

function render(){
  const { income, expense, balance } = totals();
  incomeTotalEl.textContent = euro(income);
  expenseTotalEl.textContent = euro(expense);
  balanceTotalEl.textContent = euro(balance);

  const f = filterEl.value;
  const shown = transactions
    .filter(t => f === "all" ? true : t.type === f)
    .sort((a,b) => (b.date.localeCompare(a.date)) || (b.createdAt - a.createdAt));

  txListEl.innerHTML = "";

  if(shown.length === 0){
    txListEl.innerHTML = `<div class="trow"><div class="muted">Geen transacties gevonden.</div></div>`;
    return;
  }

  for(const t of shown){
    const row = document.createElement("div");
    row.className = "trow";
    row.innerHTML = `
      <div>${t.date}</div>
      <div><span class="badge ${t.type}">${t.type === "income" ? "Inkomst" : "Uitgave"}</span></div>
      <div>${escapeHtml(t.category)}</div>
      <div class="muted">${t.note ? escapeHtml(t.note) : ""}</div>
      <div class="right">${euro(t.type === "expense" ? -t.amount : t.amount)}</div>
      <div class="right"><button class="del" data-id="${t.id}">Verwijder</button></div>
    `;
    txListEl.appendChild(row);
  }
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const type = typeEl.value;
  const category = categoryEl.value.trim();
  const amount = Number(amountEl.value);
  const date = dateEl.value; // yyyy-mm-dd
  const note = noteEl.value.trim();

  if(!category || !date || !Number.isFinite(amount) || amount <= 0){
    alert("Vul alle velden correct in.");
    return;
  }

  const tx = {
    id: uid(),
    type,
    category,
    amount: Math.round(amount * 100) / 100,
    date,
    note,
    createdAt: Date.now()
  };

  transactions.push(tx);
  save();
  form.reset();
  dateEl.valueAsDate = new Date();
  typeEl.value = "income";

  render();
});

filterEl.addEventListener("change", render);

txListEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]");
  if(!btn) return;

  const id = btn.getAttribute("data-id");
  transactions = transactions.filter(t => t.id !== id);
  save();
  render();
});

clearBtn.addEventListener("click", () => {
  if(!confirm("Weet je zeker dat je alles wilt wissen?")) return;
  transactions = [];
  save();
  render();
});

exportBtn.addEventListener("click", () => {
  const data = JSON.stringify(transactions, null, 2);
  const blob = new Blob([data], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "budgetbuddy-transactions.json";
  a.click();
  URL.revokeObjectURL(url);
});

// initial render
render();
