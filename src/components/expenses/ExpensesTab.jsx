import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { useExpenses } from '../../hooks/useExpenses'
import ArgentinaBlueDollarToggle from './ArgentinaBlueDollarToggle'
import ExpenseSummary from './ExpenseSummary'
import ExpenseList from './ExpenseList'
import AddExpenseModal from './AddExpenseModal'

export default function ExpensesTab() {
  const { user, profile, blueRate, useBlueRate } = useAppContext()
  const tripId = profile?.trip_id

  const { expenses, createExpense, updateExpense, deleteExpense, isCreating, isUpdating } =
    useExpenses(tripId, { blueRate, useBlueRate })

  const [addOpen, setAddOpen]           = useState(false)
  const [editingExpense, setEditing]    = useState(null)

  const handleSave = (payload) => {
    if (editingExpense) {
      updateExpense(
        { id: editingExpense.id, payload },
        {
          onSuccess: () => { setEditing(null); setAddOpen(false) },
        }
      )
    } else {
      createExpense(
        { payload, userId: user.id },
        {
          onSuccess: () => setAddOpen(false),
        }
      )
    }
  }

  const handleEdit = (expense) => {
    setEditing(expense)
    setAddOpen(true)
  }

  const handleModalClose = () => {
    setAddOpen(false)
    setEditing(null)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Summary card */}
      <div className="pt-4">
        <ExpenseSummary expenses={expenses} />
        <ArgentinaBlueDollarToggle />
      </div>

      {/* Expense list */}
      <ExpenseList
        expenses={expenses}
        onEdit={handleEdit}
        onDelete={(id) => deleteExpense(id)}
      />

      {/* FAB */}
      <button
        onClick={() => { setEditing(null); setAddOpen(true) }}
        className="fixed bottom-20 left-4 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center z-20 transition-colors"
        aria-label="הוסף הוצאה"
      >
        <Plus size={28} />
      </button>

      {/* Add/Edit modal */}
      <AddExpenseModal
        expense={editingExpense}
        isOpen={addOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        isSaving={isCreating || isUpdating}
      />
    </div>
  )
}
