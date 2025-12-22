// frontend/src/components/gifts/GiftManagement.jsx
import { useState, useEffect, useCallback } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { useGifts } from 'hooks/useGifts';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { Currency } from 'utils/currency';
import {
  FormSection,
  StandardFormLayout,
  SummaryCard,
  EmptyState,
  useItemManager
} from 'components/shared/FormComponents';
import { apiService } from 'utils/apiService';
import { BurgerMenu } from 'components/shared/BurgerMenu';
import { handleMenuAction } from 'utils/navigationHandler';
import { HOLIDAYS } from 'constants/holidays';

import { PersonCard } from './PersonCard';
import { ContactDetailModal } from './ContactDetailModal';
import { GiftBudgetOverview } from './GiftBudgetOverview';
import { PersonEdit } from './PersonEdit';
import { AddPersonManually } from './AddPersonManually';
import { GiftAssignment } from './GiftAssignment';

export const GiftManagement = ({ onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'gift-assignment', 'contact-management'
  const [view, setView] = useState('overview'); // 'overview', 'import', 'edit-person', 'add-person', 'assign-gifts', 'assign-gift'
  const [giftBudget, setGiftBudget] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedGift, setSelectedGift] = useState(null);
  const [onboardingData, setOnboardingData] = useState(null);
  const [viewingPersonDetails, setViewingPersonDetails] = useState(null);
  const [giftAssignments, setGiftAssignments] = useState({});

  // Use gifts hook for data management
  const {
    people,
    gifts,
    isLoading,
    error,
    addPerson,
    updatePerson,
    deletePerson,
    getBudgetSummary,
    assignGift,
    getUnassignedGifts,
    getGiftsForPerson,
    calculateSpentForPerson,
    addGiftFromExpense
  } = useGifts();

  const handleMenuActionWrapper = (actionId) => {
    handleMenuAction(actionId, onNavigate, () => setMenuOpen(false));
  };

  // Auto-sync gift transactions (silent background process)
  const syncGiftTransactions = useCallback(async () => {
    try {
      // Load expenses categorized as "Gifts" using the transactions API
      const response = await apiService.loadTransactions({
        category: 'Gifts',
        limit: 10000 // Get all gift transactions
      });

      const giftExpenses = response || [];

      if (giftExpenses.length === 0) {
        return; // Silently return if no gift transactions
      }

      console.log(`[GiftManagement] Syncing ${giftExpenses.length} gift transactions...`);

      // Track import results
      let imported = 0;

      // Add unassigned gifts from expenses
      for (const expense of giftExpenses) {
        const result = await addGiftFromExpense({
          expenseId: expense.id,
          description: expense.description || 'Gift Purchase',
          cost: Math.abs(expense.amount), // Use absolute value for gifts
          purchasedAt: expense.date
        });

        if (result.success) {
          imported++;
        }
      }

      if (imported > 0) {
        console.log(`[GiftManagement] Auto-imported ${imported} new gift${imported > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('[GiftManagement] Error syncing gift transactions:', error);
      // Silent failure - user can manually refresh if needed
    }
  }, [addGiftFromExpense]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load saved data
        const userData = await apiService.loadUserData();

        setOnboardingData(userData);

        // Check if gifts category exists and has budget
        const giftCategory = userData?.expenses?.expenseCategories?.find(
          cat => cat.name.toLowerCase() === 'gifts'
        );
        setGiftBudget(parseFloat(giftCategory?.amount) || 0);

        // Auto-sync gift transactions on page load
        await syncGiftTransactions();
      } catch (error) {
        console.error('[GiftManagement] Error loading data:', error);
      }
    };

    loadData();
  }, [syncGiftTransactions]);

  const handleAssignGift = (gift) => {
    setSelectedGift(gift);
    setView('assign-gift');
  };

  const handleSaveGiftAssignment = async (giftId, assignments) => {
    await assignGift(giftId, assignments);
    setView('assign-gifts');
    setActiveTab('gift-assignment'); // Stay on gift assignment tab
    setSelectedGift(null);
  };

  const handleSkipGift = () => {
    const unassigned = getUnassignedGifts();
    const currentIndex = unassigned.findIndex(g => g.id === selectedGift?.id);
    if (currentIndex < unassigned.length - 1) {
      // Move to next unassigned gift
      setSelectedGift(unassigned[currentIndex + 1]);
    } else {
      // No more gifts, go back to gift assignment tab
      setView('overview');
      setActiveTab('gift-assignment');
      setSelectedGift(null);
    }
  };

  const handleEditPerson = (person) => {
    setSelectedPerson(person);
    setView('edit-person');
  };

  const handleSavePerson = (updatedPerson) => {
    updatePerson(updatedPerson.id, updatedPerson);
    setView('overview');
    setActiveTab('overview'); // Return to overview tab after editing
    setSelectedPerson(null);
  };

  const handleAddPersonManually = async (newPerson) => {
    await addPerson({
      ...newPerson,
      customOccasions: [] // Initialize custom occasions
    });
    setView('overview');
    setActiveTab('contact-management'); // Stay on contact management tab
  };

  const handleDeletePerson = (personId) => {
    deletePerson(personId);
  };

  // Calculate gift budget allocation
  const calculateBudgetAllocation = () => {
  const totalPlanned = people.reduce((sum, person) => {
    const personTotal = Object.values(person.budgets || {}).reduce(
      (pSum, amount) => Currency.add(pSum, amount || 0), 0
    );
    return Currency.add(sum, personTotal);
  }, 0);
  
  const monthlyGiftBudget = Currency.toCents(giftBudget) / 100;
  const yearlyGiftBudget = Currency.multiply(monthlyGiftBudget, 12);
  const remaining = Currency.subtract(yearlyGiftBudget, totalPlanned);
  
  return {
    monthlyBudget: monthlyGiftBudget,
    yearlyBudget: yearlyGiftBudget,
    allocated: totalPlanned,
    remaining: remaining,
    peopleCount: people.length
  };
};

  const budgetInfo = calculateBudgetAllocation();

  // Render different views
  if (view === 'edit-person' && selectedPerson) {
    const assignedGifts = getGiftsForPerson(selectedPerson.id);
    return (
      <PersonEdit
        person={selectedPerson}
        people={people}
        assignedGifts={assignedGifts}
        onSave={handleSavePerson}
        onBack={() => {
          setView('overview');
          setSelectedPerson(null);
        }}
      />
    );
  }

  if (view === 'add-person') {
    return (
      <AddPersonManually
        onAdd={handleAddPersonManually}
        onBack={() => setView('overview')}
      />
    );
  }

  if (view === 'assign-gift' && selectedGift) {
    return (
      <GiftAssignment
        gift={selectedGift}
        people={people}
        onSave={handleSaveGiftAssignment}
        onBack={() => {
          setView('assign-gifts');
          setSelectedGift(null);
        }}
        onSkip={handleSkipGift}
      />
    );
  }

  // Main overview
  return (
    <>
      <BurgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAction={handleMenuActionWrapper}  // Use the wrapper
        currentPage="gifts"
      />
      <ThemeToggle />

      {/* Fixed burger menu button */}
      <button
        onClick={() => setMenuOpen(true)}
        className={`
          fixed top-8 left-8 z-40 p-2 transition-colors duration-200
          ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}
        `}
        aria-label="Open menu"
      >
        <BurgerIcon />
      </button>

      <div className={`min-h-screen transition-colors duration-300 ml-16 ${
        isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className="max-w-6xl mx-auto px-6 py-12">

          {/* Header */}
          <div className="mb-24">
            <h1 className={`text-5xl font-light leading-tight mb-4 ${
              isDarkMode ? 'text-white' : 'text-black'
            }`}>
              Gift Management
            </h1>
            <p className={`text-xl font-light ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {giftBudget > 0
                ? "Plan and track gifts for your loved ones throughout the year"
                : "Set up a gift budget in your expenses to start planning"
              }
            </p>
          </div>

        {/* Tab Navigation */}
        <div className={`mb-12 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="flex gap-12">
            <button
              onClick={() => setActiveTab('overview')}
              className={`
                pb-4 text-lg font-light transition-all relative
                ${activeTab === 'overview'
                  ? isDarkMode
                    ? 'text-white'
                    : 'text-black'
                  : isDarkMode
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-400 hover:text-gray-600'
                }
              `}
            >
              Overview
              {activeTab === 'overview' && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  isDarkMode ? 'bg-white' : 'bg-black'
                }`} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('gift-assignment')}
              className={`
                pb-4 text-lg font-light transition-all relative
                ${activeTab === 'gift-assignment'
                  ? isDarkMode
                    ? 'text-white'
                    : 'text-black'
                  : isDarkMode
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-400 hover:text-gray-600'
                }
              `}
            >
              Gift Assignment
              {activeTab === 'gift-assignment' && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  isDarkMode ? 'bg-white' : 'bg-black'
                }`} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('contact-management')}
              className={`
                pb-4 text-lg font-light transition-all relative
                ${activeTab === 'contact-management'
                  ? isDarkMode
                    ? 'text-white'
                    : 'text-black'
                  : isDarkMode
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-400 hover:text-gray-600'
                }
              `}
            >
              Contact Management
              {activeTab === 'contact-management' && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  isDarkMode ? 'bg-white' : 'bg-black'
                }`} />
              )}
            </button>
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Budget Overview */}
            {giftBudget > 0 && (
              <GiftBudgetOverview budgetInfo={budgetInfo} />
            )}

            {/* No Budget Warning */}
            {giftBudget === 0 && (
              <FormSection>
                <div className={`
                  text-center py-16 border-2 border-dashed
                  ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
                `}>
                  <h3 className={`text-2xl font-light mb-4 ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    No Gift Budget Set
                  </h3>
                  <p className={`text-lg font-light mb-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Add a "Gifts" category to your expense budget to enable gift planning
                  </p>
                  <button
                    onClick={() => onNavigate('onboarding')}
                    className={`
                      text-lg font-light border-b-2 pb-2 transition-all
                      ${isDarkMode
                        ? 'text-white border-white hover:border-gray-400'
                        : 'text-black border-black hover:border-gray-600'
                      }
                    `}
                  >
                    Edit Budget Categories
                  </button>
                </div>
              </FormSection>
            )}

            {/* People Grid */}
            {giftBudget > 0 && (
              <FormSection title="Gift Recipients">
                {people.length === 0 ? (
                  <EmptyState
                    title="No recipients yet"
                    description="Add contacts to start planning gifts"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    {people.map(person => {
                      const spent = calculateSpentForPerson(person.id);
                      return (
                        <PersonCard
                          key={person.id}
                          person={person}
                          spent={spent}
                          onViewDetails={(person) => setViewingPersonDetails(person)}
                        />
                      );
                    })}
                  </div>
                )}
              </FormSection>
            )}
          </>
        )}

        {/* GIFT ASSIGNMENT TAB */}
        {activeTab === 'gift-assignment' && (
          <>
            {giftBudget === 0 ? (
              <FormSection>
                <EmptyState
                  title="No Gift Budget Set"
                  description="Set up a gift budget in your expenses to enable gift assignment"
                />
              </FormSection>
            ) : people.length === 0 ? (
              <FormSection>
                <EmptyState
                  title="No Recipients Yet"
                  description="Add people to your gift list before assigning gifts"
                />
              </FormSection>
            ) : getUnassignedGifts().length > 0 ? (
              <FormSection title="Assign Gifts to Recipients">
                {/* Gift Assignment Table */}
                <div className="space-y-6">
                  {getUnassignedGifts().map(gift => {
                    const assignment = giftAssignments[gift.id] || {};
                    const selectedPerson = people.find(p => p.id === assignment.personId);
                    const availableOccasions = selectedPerson?.applicableHolidays || [];

                    return (
                      <div
                        key={gift.id}
                        className={`
                          border-2 transition-all
                          ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
                        `}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
                          {/* Gift Info */}
                          <div className="md:col-span-5">
                            <div className={`font-light mb-1 ${
                              isDarkMode ? 'text-white' : 'text-black'
                            }`}>
                              {gift.description}
                            </div>
                            <div className={`text-sm font-light ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {Currency.format(gift.cost)}
                              {gift.purchasedAt && (
                                <span className="ml-2">
                                  • {new Date(gift.purchasedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Person Dropdown */}
                          <div className="md:col-span-3">
                            <select
                              value={assignment.personId || ''}
                              onChange={(e) => {
                                setGiftAssignments(prev => ({
                                  ...prev,
                                  [gift.id]: {
                                    personId: e.target.value,
                                    occasionId: null // Reset occasion when person changes
                                  }
                                }));
                              }}
                              className={`
                                w-full px-4 py-3 border-2 font-light transition-colors
                                ${isDarkMode
                                  ? 'bg-black border-gray-700 text-white focus:border-white'
                                  : 'bg-white border-gray-300 text-black focus:border-black'
                                } outline-none
                              `}
                            >
                              <option value="">Select person...</option>
                              {people.map(person => (
                                <option key={person.id} value={person.id}>
                                  {person.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Occasion Dropdown */}
                          <div className="md:col-span-4">
                            <select
                              value={assignment.occasionId || ''}
                              onChange={(e) => {
                                setGiftAssignments(prev => ({
                                  ...prev,
                                  [gift.id]: {
                                    ...prev[gift.id],
                                    occasionId: e.target.value
                                  }
                                }));
                              }}
                              disabled={!assignment.personId}
                              className={`
                                w-full px-4 py-3 border-2 font-light transition-colors
                                ${isDarkMode
                                  ? 'bg-black border-gray-700 text-white focus:border-white disabled:opacity-50'
                                  : 'bg-white border-gray-300 text-black focus:border-black disabled:opacity-50'
                                } outline-none
                              `}
                            >
                              <option value="">
                                {assignment.personId ? 'Select occasion...' : 'Select person first'}
                              </option>
                              {availableOccasions.map(occasionId => {
                                // Get occasion name
                                const standardHoliday = HOLIDAYS.find(h => h.id === occasionId);
                                if (standardHoliday) {
                                  return (
                                    <option key={occasionId} value={occasionId}>
                                      {standardHoliday.name}
                                    </option>
                                  );
                                }

                                const customOccasion = selectedPerson?.customOccasions?.find(co => co.id === occasionId);
                                if (customOccasion) {
                                  return (
                                    <option key={occasionId} value={occasionId}>
                                      {customOccasion.name}
                                    </option>
                                  );
                                }

                                return null;
                              })}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Save Button */}
                {Object.values(giftAssignments).some(a => a.personId && a.occasionId) && (
                  <div className="mt-8">
                    <button
                      onClick={async () => {
                        // Save all assignments
                        const unassignedGifts = getUnassignedGifts();
                        const assignmentPromises = Object.entries(giftAssignments)
                          .filter(([_, assignment]) => assignment.personId && assignment.occasionId)
                          .map(([giftId, assignment]) => {
                            const gift = unassignedGifts.find(g => g.id === giftId);
                            return assignGift(giftId, [{
                              personId: assignment.personId,
                              occasionId: assignment.occasionId,
                              amount: gift.cost
                            }]);
                          });

                        await Promise.all(assignmentPromises);
                        setGiftAssignments({}); // Clear assignments after save
                      }}
                      className={`
                        w-full px-8 py-4 border-2 font-light text-lg transition-all
                        ${isDarkMode
                          ? 'border-white text-white hover:bg-white hover:text-black'
                          : 'border-black text-black hover:bg-black hover:text-white'
                        }
                      `}
                    >
                      Save Assignments
                    </button>
                  </div>
                )}
              </FormSection>
            ) : gifts.length > 0 ? (
              <FormSection>
                <div className={`
                  text-center py-12
                `}>
                  <h3 className={`text-xl font-light mb-4 ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    All Gifts Assigned
                  </h3>
                  <p className={`text-base font-light ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    All your gift purchases have been assigned to recipients
                  </p>
                </div>
              </FormSection>
            ) : (
              <FormSection>
                <EmptyState
                  title="No Gift Transactions Yet"
                  description="Categorize some transactions as 'Gifts' to start tracking gift purchases"
                />
              </FormSection>
            )}
          </>
        )}

        {/* CONTACT MANAGEMENT TAB */}
        {activeTab === 'contact-management' && (
          <>
            {giftBudget === 0 ? (
              <FormSection>
                <EmptyState
                  title="No Gift Budget Set"
                  description="Set up a gift budget in your expenses to enable contact management"
                />
              </FormSection>
            ) : (
              <>
                <FormSection>
                  <button
                    onClick={() => setView('add-person')}
                    className={`
                      w-full py-6 border-2 border-dashed transition-colors text-center
                      ${isDarkMode
                        ? 'border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                      }
                    `}
                  >
                    <span className="text-xl font-light">
                      Add a Contact
                    </span>
                  </button>
                </FormSection>

                {/* List of existing contacts */}
                {people.length > 0 && (
                  <FormSection title={`${people.length} Contact${people.length !== 1 ? 's' : ''}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {people.map(person => {
                        const totalBudget = Object.values(person.budgets || {}).reduce(
                          (sum, amount) => sum + (parseFloat(amount) || 0), 0
                        );
                        const spent = calculateSpentForPerson(person.id);
                        const remaining = totalBudget - spent;
                        const occasionCount = (person.applicableHolidays || []).length;

                        return (
                          <div
                            key={person.id}
                            className={`
                              p-6 border transition-all group
                              ${isDarkMode
                                ? 'border-gray-800 hover:border-gray-600'
                                : 'border-gray-200 hover:border-gray-400'
                              }
                            `}
                          >
                            {/* Header with actions */}
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h3 className={`text-xl font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                  {person.name}
                                </h3>
                                {person.relationship && (
                                  <p className={`text-sm font-light mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {person.relationship}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditPerson(person)}
                                  className={`
                                    p-2 rounded transition-colors
                                    ${isDarkMode
                                      ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                                      : 'hover:bg-gray-100 text-gray-600 hover:text-black'
                                    }
                                  `}
                                  title="Edit contact"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Remove ${person.name} from your gift list?`)) {
                                      handleDeletePerson(person.id);
                                    }
                                  }}
                                  className={`
                                    p-2 rounded transition-colors
                                    ${isDarkMode
                                      ? 'hover:bg-red-900/20 text-gray-400 hover:text-red-400'
                                      : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
                                    }
                                  `}
                                  title="Remove contact"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Budget Summary */}
                            {totalBudget > 0 && (
                              <div className={`py-3 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <div className={`text-xs font-light mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                      Budget
                                    </div>
                                    <div className={`text-base font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                      {Currency.format(totalBudget, { showCents: false })}
                                    </div>
                                  </div>
                                  <div>
                                    <div className={`text-xs font-light mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                      Spent
                                    </div>
                                    <div className={`text-base font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                      {Currency.format(spent, { showCents: false })}
                                    </div>
                                  </div>
                                  <div>
                                    <div className={`text-xs font-light mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                      Remaining
                                    </div>
                                    <div className={`text-base font-light ${
                                      remaining < 0
                                        ? isDarkMode ? 'text-red-400' : 'text-red-600'
                                        : isDarkMode ? 'text-green-400' : 'text-green-600'
                                    }`}>
                                      {Currency.format(Math.abs(remaining), { showCents: false })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Occasions Count */}
                            {occasionCount > 0 && (
                              <div className={`mt-3 text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {occasionCount} gift occasion{occasionCount !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </FormSection>
                )}
              </>
            )}
          </>
        )}

        </div>
      </div>

      {/* Contact Detail Modal */}
      {viewingPersonDetails && (
        <ContactDetailModal
          person={viewingPersonDetails}
          gifts={gifts}
          onClose={() => setViewingPersonDetails(null)}
        />
      )}
    </>
  );
};

// Helper component
const BurgerIcon = () => (
  <div className="w-5 h-5 flex flex-col justify-between">
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
    <div className="w-full h-0.5 bg-current transition-all duration-300" />
  </div>
);
