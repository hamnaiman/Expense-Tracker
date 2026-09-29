import "./style.css";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

// Keys are read from the .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const expensesRef = collection(db, "expenses");

// Page elements
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const addBtn = document.getElementById("addBtn");
const table = document.getElementById("expenseTable");
const emptyMsg = document.getElementById("emptyMsg");
const totalCountEl = document.getElementById("totalCount");
const totalAmountEl = document.getElementById("totalAmount");

// Set today's date by default
dateInput.value = new Date().toISOString().split("T")[0];

// ADD EXPENSE
addBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;

  if (title === "" || amount <= 0 || date === "") {
    alert("Please fill all fields with valid values.");
    return;
  }

  addBtn.disabled = true;
  try {
    await addDoc(expensesRef, { title, amount, category, date });
    titleInput.value = "";
    amountInput.value = "";
    categoryInput.value = "Food";
    dateInput.value = new Date().toISOString().split("T")[0];
  } catch (error) {
    console.error("Error adding expense:", error);
    alert("Could not add expense. Check your .env keys and Firestore rules.");
  }
  addBtn.disabled = false;
});

// SHOW EXPENSES (updates automatically)
onSnapshot(expensesRef, (snapshot) => {
  table.innerHTML = "";
  let totalAmount = 0;
  const expenses = [];

  snapshot.forEach((document) => {
    expenses.push({ id: document.id, ...document.data() });
  });

  // Newest date first
  expenses.sort((a, b) => b.date.localeCompare(a.date));

  expenses.forEach((expense) => {
    totalAmount += expense.amount;

    const row = document.createElement("tr");

    const titleCell = document.createElement("td");
    titleCell.textContent = expense.title;

    const amountCell = document.createElement("td");
    amountCell.textContent = "Rs. " + expense.amount.toLocaleString();

    const categoryCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = expense.category;
    categoryCell.appendChild(badge);

    const dateCell = document.createElement("td");
    dateCell.textContent = expense.date;

    const actionCell = document.createElement("td");
    actionCell.className = "right";
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.dataset.id = expense.id;
    actionCell.appendChild(deleteBtn);

    row.append(titleCell, amountCell, categoryCell, dateCell, actionCell);
    table.appendChild(row);
  });

  totalCountEl.textContent = expenses.length;
  totalAmountEl.textContent = "Rs. " + totalAmount.toLocaleString();
  emptyMsg.style.display = expenses.length === 0 ? "block" : "none";
});

// DELETE EXPENSE
table.addEventListener("click", async (event) => {
  if (event.target.classList.contains("btn-delete")) {
    if (!confirm("Delete this expense?")) return;
    try {
      await deleteDoc(doc(db, "expenses", event.target.dataset.id));
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Could not delete expense.");
    }
  }
});