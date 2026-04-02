const STORAGE_KEY = "finance-dashboard-state-v1";

const seedTransactions = [
  { id: "t1", date: "2026-01-03", amount: 4200, category: "Salary", type: "income", note: "Monthly salary" },
  { id: "t2", date: "2026-01-07", amount: 180, category: "Groceries", type: "expense", note: "Weekly groceries" },
  { id: "t3", date: "2026-01-14", amount: 60, category: "Transport", type: "expense", note: "Fuel" },
  { id: "t4", date: "2026-02-01", amount: 4200, category: "Salary", type: "income", note: "Monthly salary" },
  { id: "t5", date: "2026-02-09", amount: 95, category: "Entertainment", type: "expense", note: "Movie and snacks" },
  { id: "t6", date: "2026-02-11", amount: 320, category: "Bills", type: "expense", note: "Electricity and internet" },
  { id: "t7", date: "2026-03-01", amount: 4200, category: "Salary", type: "income", note: "Monthly salary" },
  { id: "t8", date: "2026-03-06", amount: 210, category: "Groceries", type: "expense", note: "Stock-up purchase" },
  { id: "t9", date: "2026-03-12", amount: 140, category: "Health", type: "expense", note: "Pharmacy" },
  { id: "t10", date: "2026-03-20", amount: 460, category: "Freelance", type: "income", note: "UI design task" },
  { id: "t11", date: "2026-03-24", amount: 250, category: "Dining", type: "expense", note: "Weekend outing" },
  { id: "t12", date: "2026-03-27", amount: 540, category: "Shopping", type: "expense", note: "Clothes and accessories" }
];

const app = document.querySelector("#app");
if (!app) {
  throw new Error("App root not found");
}

const state = loadState();
applyTheme();
render();

function loadState() {
  const base = {
    role: "viewer",
    theme: "light",
    transactions: seedTransactions,
    search: "",
    typeFilter: "all",
    categoryFilter: "all",
    sortBy: "date-desc",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
    groupBy: "none"
  };

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return base;

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.transactions)) return base;

    return {
      role: parsed.role === "admin" ? "admin" : "viewer",
      theme: parsed.theme === "dark" ? "dark" : "light",
      transactions: parsed.transactions.filter(isValidTransaction),
      search: typeof parsed.search === "string" ? parsed.search : "",
      typeFilter: parsed.typeFilter === "income" || parsed.typeFilter === "expense" ? parsed.typeFilter : "all",
      categoryFilter: typeof parsed.categoryFilter === "string" ? parsed.categoryFilter : "all",
      sortBy: isValidSort(parsed.sortBy) ? parsed.sortBy : "date-desc",
      dateFrom: typeof parsed.dateFrom === "string" ? parsed.dateFrom : "",
      dateTo: typeof parsed.dateTo === "string" ? parsed.dateTo : "",
      minAmount: typeof parsed.minAmount === "string" ? parsed.minAmount : "",
      maxAmount: typeof parsed.maxAmount === "string" ? parsed.maxAmount : "",
      groupBy: parsed.groupBy === "category" || parsed.groupBy === "month" ? parsed.groupBy : "none"
    };
  } catch (_error) {
    return base;
  }
}

function isValidSort(value) {
  return value === "date-desc" || value === "date-asc" || value === "amount-desc" || value === "amount-asc";
}

function isValidTransaction(value) {
  if (!value || typeof value !== "object") return false;
  return (
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.amount === "number" &&
    typeof value.category === "string" &&
    (value.type === "income" || value.type === "expense") &&
    typeof value.note === "string"
  );
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
}

function render() {
  if (!app) return;
  const preserved = captureUiState();
  const metrics = getMetrics(state.transactions);
  const categories = getExpenseCategories(state.transactions);
  const filtered = getFilteredTransactions(state.transactions);
  const trend = getMonthlyBalanceTrend(state.transactions);
  const insights = getInsights(state.transactions);

  app.innerHTML = `
    <div class="dashboard">
      <header class="topbar card">
        <div>
          <h1>Finance Dashboard</h1>
          <p>Track balances, explore transactions, and identify spending patterns.</p>
        </div>
        <div class="role-switch">
          <div class="control-col">
            <label for="roleSelect">Role</label>
            <select id="roleSelect">
              <option value="viewer" ${state.role === "viewer" ? "selected" : ""}>Viewer</option>
              <option value="admin" ${state.role === "admin" ? "selected" : ""}>Admin</option>
            </select>
          </div>
          <label class="theme-switch" for="themeToggle">
            <input id="themeToggle" type="checkbox" ${state.theme === "dark" ? "checked" : ""} />
            <span class="slider"></span>
            <span class="switch-text">Dark mode</span>
          </label>
        </div>
      </header>

      <section class="summary-grid">
        ${summaryCard("Total Balance", metrics.balance)}
        ${summaryCard("Total Income", metrics.income)}
        ${summaryCard("Total Expenses", metrics.expense)}
      </section>

      <section class="viz-grid">
        <article class="card chart-card">
          <h2>Balance Trend (Monthly)</h2>
          ${trend.length ? renderTrendChart(trend) : `<p class="empty">No trend data yet.</p>`}
        </article>
        <article class="card chart-card">
          <h2>Spending Breakdown</h2>
          ${categories.length ? renderCategoryChart(categories) : `<p class="empty">No expense categories available.</p>`}
        </article>
      </section>

      <section class="insights-grid">
        <article class="card">
          <h2>Insights</h2>
          <ul class="insights-list">
            <li><strong>Highest spending category:</strong> ${insights.topCategory}</li>
            <li><strong>Monthly comparison:</strong> ${insights.monthlyComparison}</li>
            <li><strong>Observation:</strong> ${insights.observation}</li>
          </ul>
        </article>
      </section>

      <section class="card transactions">
        <div class="transactions-head">
          <h2>Transactions</h2>
          <div class="actions-inline">
            <p>${filtered.length} of ${state.transactions.length} shown</p>
            <button id="exportCsvBtn" class="ghost-btn" type="button">Export CSV</button>
            <button id="exportJsonBtn" class="ghost-btn" type="button">Export JSON</button>
            <button id="importBtn" class="ghost-btn" type="button">Import CSV/JSON</button>
            <input id="importFile" type="file" accept=".csv,.json" hidden />
          </div>
        </div>
        <div class="controls">
          <input id="searchInput" type="search" value="${escapeHtml(state.search)}" placeholder="Search note or category" />
          <select id="typeFilter">
            <option value="all" ${state.typeFilter === "all" ? "selected" : ""}>All types</option>
            <option value="income" ${state.typeFilter === "income" ? "selected" : ""}>Income</option>
            <option value="expense" ${state.typeFilter === "expense" ? "selected" : ""}>Expense</option>
          </select>
          <select id="categoryFilter">
            <option value="all" ${state.categoryFilter === "all" ? "selected" : ""}>All categories</option>
            ${categories
              .map((item) => `<option value="${escapeHtml(item.category)}" ${state.categoryFilter === item.category ? "selected" : ""}>${escapeHtml(item.category)}</option>`)
              .join("")}
          </select>
          <select id="sortBy">
            <option value="date-desc" ${state.sortBy === "date-desc" ? "selected" : ""}>Newest first</option>
            <option value="date-asc" ${state.sortBy === "date-asc" ? "selected" : ""}>Oldest first</option>
            <option value="amount-desc" ${state.sortBy === "amount-desc" ? "selected" : ""}>Amount high to low</option>
            <option value="amount-asc" ${state.sortBy === "amount-asc" ? "selected" : ""}>Amount low to high</option>
          </select>
        </div>
        <div class="controls controls-advanced">
          <input id="dateFrom" type="date" value="${state.dateFrom}" title="From date" />
          <input id="dateTo" type="date" value="${state.dateTo}" title="To date" />
          <input id="minAmount" type="number" min="0" step="0.01" value="${state.minAmount}" placeholder="Min amount" />
          <input id="maxAmount" type="number" min="0" step="0.01" value="${state.maxAmount}" placeholder="Max amount" />
          <select id="groupBy">
            <option value="none" ${state.groupBy === "none" ? "selected" : ""}>No grouping</option>
            <option value="category" ${state.groupBy === "category" ? "selected" : ""}>Group by category</option>
            <option value="month" ${state.groupBy === "month" ? "selected" : ""}>Group by month</option>
          </select>
          <button id="clearFiltersBtn" class="ghost-btn" type="button">Clear advanced filters</button>
        </div>
        ${renderGroups(filtered)}
        ${
          state.role === "admin"
            ? `
          <form id="addForm" class="add-form">
            <input type="date" name="date" required />
            <input type="text" name="category" placeholder="Category" required />
            <input type="number" name="amount" min="0.01" step="0.01" placeholder="Amount" required />
            <select name="type" required>
              <option value="income">Income</option>
              <option value="expense" selected>Expense</option>
            </select>
            <input type="text" name="note" placeholder="Note" required />
            <button type="submit">Add transaction</button>
          </form>
        `
            : `<p class="viewer-note">Viewer mode: editing is disabled.</p>`
        }
        <div class="table-wrap">
          ${renderTable(filtered, state.role)}
        </div>
      </section>
    </div>
  `;

  bindEvents();
  restoreUiState(preserved);
}

function summaryCard(label, value) {
  return `
    <article class="card summary-card">
      <p>${label}</p>
      <h2>${currency(value)}</h2>
    </article>
  `;
}

function bindEvents() {
  const roleSelect = document.querySelector("#roleSelect");
  roleSelect?.addEventListener("change", (event) => {
    const next = event.target.value;
    state.role = next === "admin" ? "admin" : "viewer";
    saveState();
    render();
  });

  const themeToggle = document.querySelector("#themeToggle");
  themeToggle?.addEventListener("change", (event) => {
    const enabled = event.target.checked;
    state.theme = enabled ? "dark" : "light";
    applyTheme();
    saveState();
    render();
  });

  const searchInput = document.querySelector("#searchInput");
  searchInput?.addEventListener("input", (event) => {
    state.search = event.target.value;
    saveState();
    render();
  });

  const typeFilter = document.querySelector("#typeFilter");
  typeFilter?.addEventListener("change", (event) => {
    const value = event.target.value;
    state.typeFilter = value === "income" || value === "expense" ? value : "all";
    saveState();
    render();
  });

  const categoryFilter = document.querySelector("#categoryFilter");
  categoryFilter?.addEventListener("change", (event) => {
    state.categoryFilter = event.target.value;
    saveState();
    render();
  });

  const sortBy = document.querySelector("#sortBy");
  sortBy?.addEventListener("change", (event) => {
    const value = event.target.value;
    if (isValidSort(value)) {
      state.sortBy = value;
      saveState();
      render();
    }
  });

  const dateFrom = document.querySelector("#dateFrom");
  dateFrom?.addEventListener("change", (event) => {
    state.dateFrom = event.target.value;
    saveState();
    render();
  });

  const dateTo = document.querySelector("#dateTo");
  dateTo?.addEventListener("change", (event) => {
    state.dateTo = event.target.value;
    saveState();
    render();
  });

  const minAmount = document.querySelector("#minAmount");
  minAmount?.addEventListener("input", (event) => {
    state.minAmount = event.target.value;
    saveState();
    render();
  });

  const maxAmount = document.querySelector("#maxAmount");
  maxAmount?.addEventListener("input", (event) => {
    state.maxAmount = event.target.value;
    saveState();
    render();
  });

  const groupBy = document.querySelector("#groupBy");
  groupBy?.addEventListener("change", (event) => {
    const value = event.target.value;
    state.groupBy = value === "category" || value === "month" ? value : "none";
    saveState();
    render();
  });

  const clearFiltersBtn = document.querySelector("#clearFiltersBtn");
  clearFiltersBtn?.addEventListener("click", () => {
    state.dateFrom = "";
    state.dateTo = "";
    state.minAmount = "";
    state.maxAmount = "";
    state.groupBy = "none";
    saveState();
    render();
  });

  const exportCsvBtn = document.querySelector("#exportCsvBtn");
  exportCsvBtn?.addEventListener("click", () => {
    const csv = transactionsToCsv(getFilteredTransactions(state.transactions));
    downloadFile(`transactions-${Date.now()}.csv`, csv, "text/csv");
  });

  const exportJsonBtn = document.querySelector("#exportJsonBtn");
  exportJsonBtn?.addEventListener("click", () => {
    const data = getFilteredTransactions(state.transactions);
    downloadFile(`transactions-${Date.now()}.json`, JSON.stringify(data, null, 2), "application/json");
  });

  const importBtn = document.querySelector("#importBtn");
  const importFile = document.querySelector("#importFile");
  importBtn?.addEventListener("click", () => importFile?.click());
  importFile?.addEventListener("change", async () => {
    const file = importFile.files?.[0];
    if (!file) return;
    const text = await file.text();
    const imported = file.name.toLowerCase().endsWith(".json") ? parseJsonTransactions(text) : parseCsvTransactions(text);
    if (!imported.length) {
      alert("No valid transactions found in file.");
      return;
    }
    state.transactions.unshift(...imported);
    saveState();
    render();
    importFile.value = "";
  });

  const addForm = document.querySelector("#addForm");
  addForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(addForm);
    const date = String(formData.get("date") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();
    const amount = Number(formData.get("amount"));
    const type = String(formData.get("type")) === "income" ? "income" : "expense";

    if (!date || !category || !note || Number.isNaN(amount) || amount <= 0) {
      return;
    }

    state.transactions.unshift({
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}`,
      date,
      category,
      note,
      amount,
      type
    });
    saveState();
    render();
  });

  document.querySelectorAll("[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.role !== "admin") return;
      const id = button.dataset.id;
      if (!id) return;
      const tx = state.transactions.find((item) => item.id === id);
      if (!tx) return;

      const nextAmount = prompt("Update amount", String(tx.amount));
      if (nextAmount === null) return;
      const parsedAmount = Number(nextAmount);
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

      const nextNote = prompt("Update note", tx.note);
      if (nextNote === null || !nextNote.trim()) return;

      tx.amount = parsedAmount;
      tx.note = nextNote.trim();
      saveState();
      render();
    });
  });
}

function renderTable(list, role) {
  if (!list.length) {
    return `<p class="empty">No transactions match the selected filters.</p>`;
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Type</th>
          <th>Note</th>
          <th>Amount</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${list
          .map(
            (tx) => `
          <tr>
            <td>${formatDate(tx.date)}</td>
            <td>${escapeHtml(tx.category)}</td>
            <td><span class="pill ${tx.type}">${tx.type}</span></td>
            <td>${escapeHtml(tx.note)}</td>
            <td class="${tx.type === "income" ? "positive" : "negative"}">
              ${tx.type === "income" ? "+" : "-"}${currency(tx.amount)}
            </td>
            <td>
              ${
                role === "admin"
                  ? `<button data-action="edit" data-id="${tx.id}" class="ghost-btn">Edit</button>`
                  : `<span class="muted">Read only</span>`
              }
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function getFilteredTransactions(list) {
  const text = state.search.trim().toLowerCase();
  const minAmount = state.minAmount ? Number(state.minAmount) : null;
  const maxAmount = state.maxAmount ? Number(state.maxAmount) : null;
  const filtered = list.filter((item) => {
    const matchesSearch = !text || item.category.toLowerCase().includes(text) || item.note.toLowerCase().includes(text);
    const matchesType = state.typeFilter === "all" || item.type === state.typeFilter;
    const matchesCategory = state.categoryFilter === "all" || item.category === state.categoryFilter;
    const matchesFrom = !state.dateFrom || item.date >= state.dateFrom;
    const matchesTo = !state.dateTo || item.date <= state.dateTo;
    const matchesMin = minAmount === null || (!Number.isNaN(minAmount) && item.amount >= minAmount);
    const matchesMax = maxAmount === null || (!Number.isNaN(maxAmount) && item.amount <= maxAmount);
    return matchesSearch && matchesType && matchesCategory && matchesFrom && matchesTo && matchesMin && matchesMax;
  });

  return filtered.sort((a, b) => {
    switch (state.sortBy) {
      case "date-asc":
        return a.date.localeCompare(b.date);
      case "amount-desc":
        return b.amount - a.amount;
      case "amount-asc":
        return a.amount - b.amount;
      case "date-desc":
      default:
        return b.date.localeCompare(a.date);
    }
  });
}

function renderGroups(list) {
  if (state.groupBy === "none" || !list.length) return "";
  const map = new Map();
  list.forEach((tx) => {
    const key = state.groupBy === "month" ? tx.date.slice(0, 7) : tx.category;
    const curr = map.get(key) ?? { income: 0, expense: 0, count: 0 };
    curr.count += 1;
    if (tx.type === "income") curr.income += tx.amount;
    else curr.expense += tx.amount;
    map.set(key, curr);
  });
  const groups = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  return `
    <div class="group-panel">
      <h3>Grouped View (${state.groupBy})</h3>
      <div class="group-grid">
        ${groups
          .map(
            ([key, value]) => `
          <article class="group-card">
            <strong>${escapeHtml(key)}</strong>
            <span>Transactions: ${value.count}</span>
            <span>Income: ${currency(value.income)}</span>
            <span>Expense: ${currency(value.expense)}</span>
            <span>Net: ${currency(value.income - value.expense)}</span>
          </article>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

function getMetrics(list) {
  const income = list.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expense = list.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  return { income, expense, balance: income - expense };
}

function getMonthlyBalanceTrend(list) {
  const byMonth = new Map();
  list.forEach((item) => {
    const month = item.date.slice(0, 7);
    const signedAmount = item.type === "income" ? item.amount : -item.amount;
    byMonth.set(month, (byMonth.get(month) ?? 0) + signedAmount);
  });

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));
}

function renderTrendChart(points) {
  const min = Math.min(...points.map((point) => point.value));
  const max = Math.max(...points.map((point) => point.value));
  const range = Math.max(max - min, 1);

  const coordinates = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - ((point.value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return `
    <div class="trend-chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline fill="none" stroke="currentColor" stroke-width="2" points="${coordinates}" />
      </svg>
      <div class="labels">
        ${points.map((point) => `<span>${point.month.replace("-", "/")}</span>`).join("")}
      </div>
    </div>
  `;
}

function getExpenseCategories(list) {
  const totals = new Map();
  list
    .filter((item) => item.type === "expense")
    .forEach((item) => totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount));

  const max = Math.max(...totals.values(), 1);

  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount, percentage: (amount / max) * 100 }))
    .sort((a, b) => b.amount - a.amount);
}

function renderCategoryChart(data) {
  return `
    <div class="bar-chart">
      ${data
        .map(
          (item) => `
        <div class="bar-row">
          <span>${escapeHtml(item.category)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${Math.max(item.percentage, 5)}%"></div></div>
          <strong>${currency(item.amount)}</strong>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function getInsights(list) {
  const expenses = getExpenseCategories(list);
  const topCategory = expenses[0] ? `${expenses[0].category} (${currency(expenses[0].amount)})` : "No spending data";

  const monthly = getMonthlyBalanceTrend(list);
  const current = monthly[monthly.length - 1]?.value ?? 0;
  const previous = monthly[monthly.length - 2]?.value ?? 0;
  const diff = current - previous;
  const direction = diff > 0 ? "increased" : diff < 0 ? "decreased" : "stayed flat";
  const monthlyComparison =
    monthly.length > 1 ? `Net balance ${direction} by ${currency(Math.abs(diff))} from last month.` : "Need at least two months to compare.";

  const avgExpense =
    list.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0) /
    Math.max(list.filter((item) => item.type === "expense").length, 1);
  const observation = `Average expense transaction is ${currency(avgExpense)}.`;

  return { topCategory, monthlyComparison, observation };
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(date));
}

function currency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function captureUiState() {
  const active = document.activeElement;
  const canCaptureCursor = active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA");
  return {
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    activeId: active && active.id ? active.id : "",
    selectionStart: canCaptureCursor ? active.selectionStart : null,
    selectionEnd: canCaptureCursor ? active.selectionEnd : null
  };
}

function restoreUiState(snapshot) {
  if (!snapshot) return;
  window.scrollTo(snapshot.scrollX, snapshot.scrollY);

  if (!snapshot.activeId) return;
  const nextActive = document.getElementById(snapshot.activeId);
  if (!nextActive) return;

  nextActive.focus({ preventScroll: true });

  if (
    typeof snapshot.selectionStart === "number" &&
    typeof snapshot.selectionEnd === "number" &&
    typeof nextActive.setSelectionRange === "function"
  ) {
    nextActive.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
  }
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function transactionsToCsv(list) {
  const headers = ["id", "date", "amount", "category", "type", "note"];
  const rows = list.map((tx) =>
    [tx.id, tx.date, tx.amount, tx.category, tx.type, tx.note]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

function parseJsonTransactions(text) {
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) return [];
    return data
      .filter(isValidTransaction)
      .map((item) => ({ ...item, id: item.id || `tx-${Date.now()}-${Math.random().toString(16).slice(2)}` }));
  } catch (_error) {
    return [];
  }
}

function parseCsvTransactions(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const needed = ["date", "amount", "category", "type", "note"];
  if (!needed.every((key) => headers.includes(key))) return [];

  const indexOf = (name) => headers.indexOf(name);
  const parsed = [];
  for (let i = 1; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i]);
    const tx = {
      id: row[indexOf("id")] || `tx-${Date.now()}-${i}`,
      date: row[indexOf("date")] || "",
      amount: Number(row[indexOf("amount")]),
      category: row[indexOf("category")] || "",
      type: row[indexOf("type")] === "income" ? "income" : "expense",
      note: row[indexOf("note")] || ""
    };
    if (isValidTransaction(tx) && tx.amount > 0) parsed.push(tx);
  }
  return parsed;
}

function parseCsvLine(line) {
  const output = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      output.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  output.push(current);
  return output;
}
