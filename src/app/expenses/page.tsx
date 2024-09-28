"use client";

import { auth, db } from "@/firebase/firebaseconfig";
import { addDoc, collection } from "firebase/firestore";
import { FormEvent, useState } from "react";



export default function expenses() {
  
  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<number | string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    console.log({title, amount, category, date, note});
  }

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

  return (
    <div>
      <h1>Add Expense</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        
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

        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Expense'}</button>
      </form>
    </div>
  )
}