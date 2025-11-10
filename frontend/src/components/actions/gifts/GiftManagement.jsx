// frontend/src/components/gifts/GiftManagement.jsx
import React, { useState, useEffect } from 'react';

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
import { PersonCard } from './PersonCard';
import { GiftBudgetOverview } from './GiftBudgetOverview';
import { PersonEdit } from './PersonEdit';
import { AddPersonManually } from './AddPersonManually';
import { GiftAssignment } from './GiftAssignment';
import { handleMenuAction } from 'utils/navigationHandler';

export const GiftManagement = ({ onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'gift-assignment', 'contact-management'
  const [view, setView] = useState('overview'); // 'overview', 'import', 'edit-person', 'add-person', 'assign-gifts', 'assign-gift'
  const [giftBudget, setGiftBudget] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedGift, setSelectedGift] = useState(null);
  const [onboardingData, setOnboardingData] = useState(null);

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
      } catch (error) {
        console.error('[GiftManagement] Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const handleMenuActionWrapper = (actionId) => {
    handleMenuAction(actionId, onNavigate, () => setMenuOpen(false));
  };


  const handleImportGiftsFromExpenses = async () => {
    try {
      // Load expenses categorized as "Gifts"
      const userData = await apiService.loadUserData();

      // Debug logging
      console.log('[GiftManagement] All transactions:', userData?.expenses?.transactions);
      console.log('[GiftManagement] Filtering for gift category...');

      const giftExpenses = userData?.expenses?.transactions?.filter(tx => {
        const category = tx.category?.toLowerCase().trim();
        console.log('[GiftManagement] Transaction:', tx.description, 'Category:', category);
        return category === 'gifts' || category === 'gift';
      }) || [];

      console.log('[GiftManagement] Found gift expenses:', giftExpenses);

      if (giftExpenses.length === 0) {
        alert('No expenses found with "Gifts" category. Please categorize some expenses as gifts first.');
        return;
      }

      // Track import results
      let imported = 0;
      let skipped = 0;
      let failed = 0;

      // Add unassigned gifts from expenses
      for (const expense of giftExpenses) {
        const result = await addGiftFromExpense({
          expenseId: expense.id,
          description: expense.description || 'Gift Purchase',
          cost: expense.amount,
          purchasedAt: expense.date
        });

        if (result.success) {
          imported++;
        } else if (result.skipped) {
          skipped++;
        } else {
          failed++;
        }
      }

      // Show feedback
      let message = '';
      if (imported > 0) {
        message += `✓ Imported ${imported} new gift${imported > 1 ? 's' : ''}`;
      }
      if (skipped > 0) {
        message += `${message ? '\n' : ''}⊘ Skipped ${skipped} duplicate${skipped > 1 ? 's' : ''}`;
      }
      if (failed > 0) {
        message += `${message ? '\n' : ''}✗ Failed to import ${failed} gift${failed > 1 ? 's' : ''}`;
      }

      if (message) {
        alert(message);
      }

      // Only go to assign view if there are unassigned gifts
      if (imported > 0 || getUnassignedGifts().length > 0) {
        setView('assign-gifts');
        setActiveTab('gift-assignment'); // Switch to gift assignment tab
      }
    } catch (error) {
      console.error('[GiftManagement] Error importing gifts from expenses:', error);
      alert('Failed to import gifts. Please try again.');
    }
  };

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

  if (view === 'assign-gifts') {
    const unassignedGifts = getUnassignedGifts();

    return (
      <>
        <ThemeToggle />
        <StandardFormLayout
          title="Assign Gifts"
          subtitle="Assign purchased gifts from your expenses to people and occasions"
          onBack={() => setView('overview')}
          backLabel="Back to Overview"
        >
          {unassignedGifts.length === 0 ? (
            <EmptyState
              title="All gifts assigned!"
              description="All your gift expenses have been assigned to people and occasions"
            />
          ) : (
            <FormSection title={`${unassignedGifts.length} Unassigned Gift${unassignedGifts.length > 1 ? 's' : ''}`}>
              <div className="space-y-4">
                {unassignedGifts.map(gift => (
                  <div
                    key={gift.id}
                    className={`
                      p-6 border cursor-pointer transition-all
                      ${isDarkMode
                        ? 'border-gray-800 hover:border-gray-600'
                        : 'border-gray-200 hover:border-gray-400'
                      }
                    `}
                    onClick={() => handleAssignGift(gift)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className={`font-light text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {gift.description}
                        </div>
                        <div className={`text-sm font-light ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(gift.purchasedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`text-xl font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {Currency.format(gift.cost)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>
          )}
        </StandardFormLayout>
      </>
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

      <StandardFormLayout
        title="Gift Management"
        subtitle={giftBudget > 0
          ? "Plan and track gifts for your loved ones throughout the year"
          : "Set up a gift budget in your expenses to start planning"
        }
        onBack={() => onNavigate('dashboard')}
        backLabel="Dashboard"
        className="ml-16"
      >

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
                          onEdit={() => handleEditPerson(person)}
                          onDelete={() => handleDeletePerson(person.id)}
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
            ) : (
              <FormSection title="Gift Assignments">
                <div className={`
                  text-center py-12 border-2 border-dashed
                  ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
                `}>
                  <h3 className={`text-xl font-light mb-4 ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    Assign Gifts to People
                  </h3>
                  <p className={`text-base font-light mb-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Import your gift expenses and assign them to recipients and occasions
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={handleImportGiftsFromExpenses}
                      className={`
                        text-lg font-light border-b-2 pb-2 transition-all
                        ${isDarkMode
                          ? 'text-white border-white hover:border-gray-400'
                          : 'text-black border-black hover:border-gray-600'
                        }
                      `}
                    >
                      Import Gifts from Expenses
                    </button>
                    {getUnassignedGifts().length > 0 && (
                      <button
                        onClick={() => setView('assign-gifts')}
                        className={`
                          text-lg font-light border-b border-transparent hover:border-current pb-1
                          ${isDarkMode
                            ? 'text-gray-400 hover:text-white'
                            : 'text-gray-600 hover:text-black'
                          }
                        `}
                      >
                        View Unassigned Gifts ({getUnassignedGifts().length})
                      </button>
                    )}
                  </div>
                </div>
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
                  <div className={`
                    text-center py-8 border-2 border-dashed
                    ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
                  `}>
                    <h3 className={`text-lg font-light mb-4 ${
                      isDarkMode ? 'text-white' : 'text-black'
                    }`}>
                      Add a Contact
                    </h3>
                    <button
                      onClick={() => setView('add-person')}
                      className={`
                        text-2xl font-light transition-colors
                        ${isDarkMode
                          ? 'text-white hover:text-gray-400'
                          : 'text-black hover:text-gray-600'
                        }
                      `}
                      title="Add a new contact"
                    >
                      +
                    </button>
                  </div>
                </FormSection>

                {/* List of existing contacts */}
                {people.length > 0 && (
                  <FormSection title={`${people.length} Contact${people.length !== 1 ? 's' : ''}`}>
                    <div className="space-y-4">
                      {people.map(person => (
                        <div
                          key={person.id}
                          className={`
                            p-6 border transition-all
                            ${isDarkMode
                              ? 'border-gray-800 hover:border-gray-600'
                              : 'border-gray-200 hover:border-gray-400'
                            }
                          `}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className={`text-lg font-light ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                {person.name}
                              </div>
                              {person.relationship && (
                                <div className={`text-sm font-light mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {person.relationship}
                                </div>
                              )}
                              {person.birthday && (
                                <div className={`text-sm font-light mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  Birthday: {new Date(person.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleEditPerson(person)}
                                className={`
                                  text-sm font-light transition-colors
                                  ${isDarkMode
                                    ? 'text-gray-500 hover:text-gray-300'
                                    : 'text-gray-400 hover:text-gray-600'
                                  }
                                `}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Remove ${person.name} from your gift list?`)) {
                                    handleDeletePerson(person.id);
                                  }
                                }}
                                className={`
                                  text-sm font-light transition-colors
                                  ${isDarkMode
                                    ? 'text-gray-500 hover:text-red-400'
                                    : 'text-gray-400 hover:text-red-600'
                                  }
                                `}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </FormSection>
                )}
              </>
            )}
          </>
        )}

      </StandardFormLayout>
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
