import "./style.css";

type TransactionType = "income" | "expense";
type Role = "viewer" | "admin";
type SortBy = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  type: TransactionType;
  note: string;
}

interface DashboardState {
  role: Role;
  transactions: Transaction[];
  search: string;
  typeFilter: "all" | TransactionType;
  categoryFilter: string;
  sortBy: SortBy;
}

const STORAGE_KEY = "finance-dashboard-state-v1";

const seedTransactions: Transaction[] = [
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

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("App root not found");
}

const state: DashboardState = loadState();
render();

function loadState(): DashboardState {
  const base: DashboardState = {
    role: "viewer",
    transactions: seedTransactions,
    search: "",
    typeFilter: "all",
    categoryFilter: "all",
    sortBy: "date-desc"
  };

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return base;

  try {
    const parsed = JSON.parse(saved) as Partial<DashboardState>;
    if (!Array.isArray(parsed.transactions)) return base;

    return {
      role: parsed.role === "admin" ? "admin" : "viewer",
      transactions: parsed.transactions.filter(isValidTransaction),
      search: typeof parsed.search === "string" ? parsed.search : "",
      typeFilter: parsed.typeFilter === "income" || parsed.typeFilter === "expense" ? parsed.typeFilter : "all",
      categoryFilter: typeof parsed.categoryFilter === "string" ? parsed.categoryFilter : "all",
      sortBy: isValidSort(parsed.sortBy) ? parsed.sortBy : "date-desc"
    };
  } catch {
    return base;
  }
}

function isValidSort(value: unknown): value is SortBy {
  return value === "date-desc" || value === "date-asc" || value === "amount-desc" || value === "amount-asc";
}

function isValidTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== "object") return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.date === "string" &&
    typeof t.amount === "number" &&
    typeof t.category === "string" &&
    (t.type === "income" || t.type === "expense") &&
    typeof t.note === "string"
  );
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  if (!app) return;
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
          <label for="roleSelect">Role</label>
          <select id="roleSelect">
            <option value="viewer" ${state.role === "viewer" ? "selected" : ""}>Viewer</option>
            <option value="admin" ${state.role === "admin" ? "selected" : ""}>Admin</option>
          </select>
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
          <p>${filtered.length} of ${state.transactions.length} shown</p>
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
}

function summaryCard(label: string, value: number): string {
  return `
    <article class="card summary-card">
      <p>${label}</p>
      <h2>${currency(value)}</h2>
    </article>
  `;
}

function bindEvents() {
  const roleSelect = document.querySelector<HTMLSelectElement>("#roleSelect");
  roleSelect?.addEventListener("change", (event) => {
    const next = (event.target as HTMLSelectElement).value;
    state.role = next === "admin" ? "admin" : "viewer";
    saveState();
    render();
  });

  const searchInput = document.querySelector<HTMLInputElement>("#searchInput");
  searchInput?.addEventListener("input", (event) => {
    state.search = (event.target as HTMLInputElement).value;
    saveState();
    render();
  });

  const typeFilter = document.querySelector<HTMLSelectElement>("#typeFilter");
  typeFilter?.addEventListener("change", (event) => {
    const value = (event.target as HTMLSelectElement).value;
    state.typeFilter = value === "income" || value === "expense" ? value : "all";
    saveState();
    render();
  });

  const categoryFilter = document.querySelector<HTMLSelectElement>("#categoryFilter");
  categoryFilter?.addEventListener("change", (event) => {
    state.categoryFilter = (event.target as HTMLSelectElement).value;
    saveState();
    render();
  });

  const sortBy = document.querySelector<HTMLSelectElement>("#sortBy");
  sortBy?.addEventListener("change", (event) => {
    const value = (event.target as HTMLSelectElement).value;
    if (isValidSort(value)) {
      state.sortBy = value;
      saveState();
      render();
    }
  });

  const addForm = document.querySelector<HTMLFormElement>("#addForm");
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
      id: crypto.randomUUID(),
      date,
      category,
      note,
      amount,
      type
    });
    saveState();
    render();
  });

  document.querySelectorAll<HTMLButtonElement>("[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.role !== "admin") return;
      const id = button.dataset.id;
      if (!id) return;
      const tx = state.transactions.find((item) => item.id === id);
      if (!tx) return;

      const nextAmount = prompt("Update amount", tx.amount.toString());
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

function renderTable(list: Transaction[], role: Role): string {
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

function getFilteredTransactions(list: Transaction[]): Transaction[] {
  const text = state.search.trim().toLowerCase();
  const filtered = list.filter((item) => {
    const matchesSearch = !text || item.category.toLowerCase().includes(text) || item.note.toLowerCase().includes(text);
    const matchesType = state.typeFilter === "all" || item.type === state.typeFilter;
    const matchesCategory = state.categoryFilter === "all" || item.category === state.categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
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

function getMetrics(list: Transaction[]) {
  const income = list.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expense = list.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  return { income, expense, balance: income - expense };
}

function getMonthlyBalanceTrend(list: Transaction[]) {
  const byMonth = new Map<string, number>();
  list.forEach((item) => {
    const month = item.date.slice(0, 7);
    const signedAmount = item.type === "income" ? item.amount : -item.amount;
    byMonth.set(month, (byMonth.get(month) ?? 0) + signedAmount);
  });

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));
}

function renderTrendChart(points: Array<{ month: string; value: number }>): string {
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

function getExpenseCategories(list: Transaction[]) {
  const totals = new Map<string, number>();
  list
    .filter((item) => item.type === "expense")
    .forEach((item) => totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount));

  const max = Math.max(...totals.values(), 1);

  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount, percentage: (amount / max) * 100 }))
    .sort((a, b) => b.amount - a.amount);
}

function renderCategoryChart(data: Array<{ category: string; amount: number; percentage: number }>): string {
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

function getInsights(list: Transaction[]) {
  const expenses = getExpenseCategories(list);
  const topCategory = expenses[0] ? `${expenses[0].category} (${currency(expenses[0].amount)})` : "No spending data";

  const monthly = getMonthlyBalanceTrend(list);
  const current = monthly[monthly.length - 1]?.value ?? 0;
  const previous = monthly[monthly.length - 2]?.value ?? 0;
  const diff = current - previous;
  const direction = diff > 0 ? "increased" : diff < 0 ? "decreased" : "stayed flat";
  const monthlyComparison = monthly.length > 1 ? `Net balance ${direction} by ${currency(Math.abs(diff))} from last month.` : "Need at least two months to compare.";

  const avgExpense =
    list.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0) /
    Math.max(list.filter((item) => item.type === "expense").length, 1);
  const observation = `Average expense transaction is ${currency(avgExpense)}.`;

  return { topCategory, monthlyComparison, observation };
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(date));
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
