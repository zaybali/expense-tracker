"use client";

import { auth, db } from "@/firebase/firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { FormEvent, useEffect, useState } from "react";
import ExpenseChart from "../components/expenseChart";
import { Box, Button, Flex, FormControl, FormLabel, Input, Select, Textarea, Text, Heading } from "@chakra-ui/react";
import { motion } from 'framer-motion';
import { useRouter } from "next/navigation";

const MotionBox = motion(Box);


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

  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  
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

        fetchExpenses();
        setAuthChecked(true);
      }
      else {
        router.push('/login');
      }
    });
    return () => detachOnAuthListner();
  },[router])

  if(!authChecked) {
    return <h1 style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight: '100vh'}}>
      Loading...
    </h1>;
  }

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
    <>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <Box
        as="form"
        onSubmit={editingId ? handleUpdate : handleSubmit}
        maxW="600px"  // Maximum width on large screens
        mx="auto"    // Center the form horizontally
        p={6}        // Padding around the form
        mt={10}      // Top margin for spacing
        boxShadow="lg"  // Add some shadow for a modern look
        borderRadius="md"  // Rounded corners for a cleaner UI
        bg="white"    // Background color for a clean look
      >
        
      <Heading as="h3" size="lg" mb={4}>
       {editingId ? 'Update Expense' : 'Add Expense'}
      </Heading>
      <FormControl id="title" isRequired>
      <FormLabel>Title</FormLabel>
        <Input
          placeholder="Enter title"
          name="title"
          value={title}
          onChange={handleInputChange}
        />
      </FormControl>

      <FormControl id="amount" isRequired mt={4}>
        <FormLabel>Amount</FormLabel>
        <Input
          type="number"
          placeholder="Enter amount"
          name="amount"
          value={amount}
          onChange={handleInputChange}
        />
      </FormControl>

      <FormControl id="category" isRequired mt={4}>
      <FormLabel>Category</FormLabel>
        <Select
          placeholder="Select category"
          name="category"
          value={category}
          onChange={handleInputChange}
        >
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Bills">Bills</option>
          <option value="Education">Education</option>
          <option value="Luxuries">Luxuries</option>
          <option value="Others">Others</option>
        </Select>
    </FormControl>

        <input type="date" name="date" value={date} style={{display:"none"}} onChange={handleInputChange}  />

        <FormControl id="note">
          <FormLabel>Note (Optional)</FormLabel>
          <Textarea
            name="note"
            placeholder="Optional Note"
            value={note}
            onChange={handleInputChange}
          />
        </FormControl>
        <Button mt={6}
          colorScheme="blue"
          type="submit"
          isLoading={loading}
          width={{ base: "100%", md: "auto" }}
          >
         Add Expense
      </Button>
      </Box>

      <Box
      as="form"
      maxW="600px"    // Limiting the width of the form
      mx="auto"       // Centering the form horizontally
      p={4}           // Padding around the form
      mt={6}          // Top margin for spacing
    >
      <Heading as="h3" size="lg" mb={4}>
        Filter Expenses
      </Heading>

      <Flex direction={{ base: "column", md: "row" }} gap={4} align="center" mb={4}>
        {/* Start Date Input */}
        <FormControl id="startDate">
          <FormLabel>Start Date</FormLabel>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </FormControl>

        {/* End Date Input */}
        <FormControl id="endDate">
          <FormLabel>End Date</FormLabel>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </FormControl>
      </Flex>

      <Flex direction={{ base: "column", md: "row" }} gap={4} align="center">
        {/* Category Select */}
        <FormControl id="category" mb={{ base: 4, md: 0 }}>
          <FormLabel>Category</FormLabel>
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            placeholder="All Categories"
          >
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Bills">Bills</option>
            <option value="Education">Education</option>
            <option value="Luxuries">Luxuries</option>
            <option value="Others">Others</option>
          </Select>
        </FormControl>

        {/* Apply Filters Button */}
        <Button type="button" colorScheme="blue" width="full" maxW="150px" mt={8} onClick={fetchFilteredExpenses}>
          Apply Filters
        </Button>
      </Flex>
    </Box>

      {fetchLoading ? (
  <Text>Loading Expenses...</Text>
) : (
  <Flex
    direction={{ base: 'column', lg: 'row' }}  // Stack vertically on small screens, side by side on large screens
    maxW="1200px"  // Adjust the maximum width as per your design needs
    mx="auto"
    p={4}
    gap={16}  // Spacing between columns
  >
    {/* Left column: Expense List */}
    <Box flex="2">
      <Heading as="h3" size="lg" mb={4}>
        Your Expenses
      </Heading>
      {expenses.map((expense) => (
        <MotionBox
          key={expense.id}
          p={4}
          mb={4}
          boxShadow="md"
          borderRadius="md"
          bg="gray.50"
          _hover={{
            bg: "gray.100",
            transform: "scale(1.02)",
            transition: "all 0.2s",
          }}
          initial={{ opacity: 0, y: 20 }}   // Initial animation state
          animate={{ opacity: 1, y: 0 }}    // Final animation state
          transition={{ duration: 0.5 }}    // Animation duration
        >
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="lg" fontWeight="bold">
                {expense.title}
              </Text>
              <Text fontSize="md" color="gray.600">
                {expense.amount} - {expense.category} - {new Date(expense.date).toLocaleDateString()}
              </Text>
              {expense.note && (
                <Text fontSize="sm" color="gray.500" mt={2}>
                  {expense.note}
                </Text>
              )}
            </Box>

            <Flex>
              <Button
                size="sm"
                colorScheme="blue"
                mr={2}
                onClick={() => handleEdit(expense)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                colorScheme="red"
                onClick={() => handleDelete(expense.id)}
              >
                Delete
              </Button>
            </Flex>
          </Flex>
        </MotionBox>
      ))}
    </Box>

    {/* Right column: Expense Summary and Chart */}
    <Flex direction="column" flex="1" >
      <Box mb={8}>
        <Heading as="h2" size="lg" mb={4}>
          Expense Summary
        </Heading>
        <Text fontSize="md">Total Amount Spent: Rs. {calculateTotal()}</Text>

        <Heading as="h3" size="md" mt={4} mb={2}>
          Category Wise:
        </Heading>
        <ul>
          {Object.entries(CalculateCatTotals()).map(([category, total]) => (
            <li key={category}>
              {category}: Rs. {total}
            </li>
          ))}
        </ul>
      </Box>

      {/* Pie Chart */}
      <Box>
        <ExpenseChart categoryTotals={categoryTotals} />
      </Box>
    </Flex>
  </Flex>
)}
    </>
  )
}