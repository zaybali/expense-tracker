"use client";

import { auth, db } from "@/firebase/firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";
import ExpenseChart from "../components/expenseChart";



export default function expenses() {
  
  // Add expense Data states
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<number | string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetching states
  const [expenses, setExpenses] = useState<any[]>([]);
  const [fetchLoading, setFetchLoading] = useState<boolean>(true);

  // Editing state
  const [editingId, setEditingId] = useState<string |null>(null);
  
  // Filtering states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  
  // Form Handle & Add Data to Firestore
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    let uid = auth.currentUser?.uid;
    
    try {
      let collectionRef = collection(db, 'expenses');
      await addDoc(collectionRef,{
        title,
        amount,
        category,
        date,
        note,
        userId: uid,
      });
      setLoading(false);
      setTitle('');
      setAmount('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    } catch (err) {
      setError('Failed to save expense.');
      setLoading(false);
    }
    console.log({title, amount, category, date, note, uid});
  }
  
  // Handling value inputs from user & setting them in useState
  const handleInputChange = (e: any) => {
    const {name, value} = e.target;
    console.log(name, value);

    if (name === 'amount') {
      setAmount(value);
    } else if (name === 'title') {
      setTitle(value);
    } else if (name === 'category') {
      setCategory(value);
    } else if (name === 'date') {
      setDate(value);
    } else if (name === 'note') {
      setNote(value);
    }
  };

  // Fetch expenses for the current user
  const fetchExpenses = async () => {
    setFetchLoading(true);
    try {
      let collectionRef = collection(db, 'expenses');
      let uid = auth.currentUser?.uid;

        const q = query(  
        collectionRef,
        where('userId', '==', uid)
      );
     
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const expensesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExpenses(expensesData);
        setFetchLoading(false);
      });
      
      return unsubscribe;
    } catch(err) {
      setError('Failed to fetch expenses');
      setFetchLoading(false);
    }
  }

  // useEffect to get Data if user is validated & also detach onAuth listner
  useEffect(()=>{
   const detachOnAuthListner =  auth.onAuthStateChanged((user)=>{
      if(user) {

        const unsubscribe = fetchExpenses();

        return () => {
          if(unsubscribe) {
            unsubscribe();
          }
        }
      }
    });
    return () => detachOnAuthListner();
  },[])

  // Fetching filtered Data
  const fetchFilteredExpenses = async () => {
    setFetchLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      const collectionRef = collection(db, 'expenses');
      let q = query(collectionRef, where('userId', '==', uid));
  
      // Apply date range filters
      console.log(startDate, endDate);
      if (startDate) {
        q = query(q, where('date', '>=', startDate));
      }
      if (endDate) {
        q = query(q, where('date', '<=', endDate));
      }
  
      // Apply category filter
      if (filterCategory) {
        q = query(q, where('category', '==', filterCategory));
      }
  
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const expensesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExpenses(expensesData);
        setFetchLoading(false); // Stop loading after initial fetch
      });
    
      return unsubscribe; // Clean up listener on unmount
    } catch (err) {
      setError('Failed to fetch expenses with filters');
      setFetchLoading(false);
    }
  };

  // Delete Doc
  const handleDelete = async (id: string) => {
    try {
      const expenseDoc = doc(db, 'expenses', id);
      await deleteDoc(expenseDoc);
      setExpenses(expenses.filter((expense)=> expense.id !== id)); //update state after deletion
    } catch(err) {
      setError('Failed to delete expense')
    }
  }

  // Setting useState values from edit button
  const handleEdit = (expense: any) => {
    setTitle(expense.title);
    setAmount(expense.amount);
    setCategory(expense.category);
    // setDate(expense.date);
    setNote(expense.note || '');
    setEditingId(expense.id);
  }

  // Updating Data in firestore using updateDoc
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if(!editingId) return;

    setLoading(true);
    try {
      const expenseDoc = doc(db, 'expenses', editingId);
      await updateDoc(expenseDoc, {
        title,
        amount: Number(amount),
        category,
        date,
        note,
      });
      setEditingId(null);
      setTitle('');
      setAmount('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      fetchExpenses(); // Refetch expenses after update
    } catch (err) {
      setError('Failed to update expense');
    } finally {
      setLoading(false);
    }
  }

  // Calculate total expenses
  const calculateTotal = () => {
    return expenses.reduce((total, expense)=> total + Number(expense.amount), 0);
  };

  type categoryTotals = {
    [category: string]: number;
  }

  // Calculate total expense by category
  const CalculateCatTotals = (): categoryTotals => {
    return expenses.reduce((totals, expense) => {
      const category = expense.category;
      const amount = Number(expense.amount);
      if(!totals[category]) {
        totals[category] = 0;
      }
      totals[category] += amount;
      return totals;
    }, {} as Record<string, number>);
  };

  const categoryTotals = CalculateCatTotals();

  return (
    <div>
      <h1>{editingId ? 'Update Expense' : 'Add Expense'}</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={editingId ? handleUpdate : handleSubmit}>
        
        <input type="text" name="title" placeholder="Title" value={title} onChange={handleInputChange} required />

        <input type="number" name="amount" placeholder="Amount" value={amount} onChange={handleInputChange} required />

        <select name="category" value={category} onChange={handleInputChange} required>
          <option value="">Select Category</option>
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Bills">Bills</option>
          <option value="Education">Education</option>
          <option value="Luxuries">Luxuries</option>
          <option value="Others">Others</option>
        </select>

        <input type="date" name="date" value={date} style={{display:"none"}} onChange={handleInputChange}  />

        <textarea name="note" placeholder="Optional Note" value={note} onChange={handleInputChange}/>

        <button type="submit" disabled={loading}>{loading ? 'Saving...' : editingId ? 'Update Expense' : 'Add Expense'}</button>
      </form>

      <form>
        <h3>Filter Expenses</h3>
        <label>
          Start Date:
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          End Date:
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <label>
          Category:
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Bills">Bills</option>
            <option value="Education">Education</option>
            <option value="Luxuries">Luxuries</option>
            <option value="Others">Others</option>
          </select>
        </label>
        <button type="button" onClick={fetchFilteredExpenses}>Apply Filters</button>
      </form>

      <h2>Your Expenses</h2>
      {fetchLoading ? (
        <p>Loading Expenses...</p>
      ): (
        <ul>
          {expenses.map((expense) =>(
            <li key={expense.id}>
              <strong>{expense.title}</strong> - {expense.amount} - {expense.category} - {new Date(expense.date).toLocaleDateString()}
              <br />
              {expense.note && <em>{expense.note}</em>}
              <button onClick={()=>handleEdit(expense)}>Edit</button>
              <button onClick={()=> handleDelete(expense.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      <h2>Expense Summary</h2>
      <p>Total Amount Spent: Rs.{calculateTotal()}</p>

      <h3>Category Wise:</h3>
      <ul>
        {Object.entries(CalculateCatTotals()).map(([category, total])=>(
          <li key={category}>
            {category}: Rs.{total}
          </li>
        ))}
      </ul>

      <ExpenseChart categoryTotals={categoryTotals} />
    </div>
  )
}