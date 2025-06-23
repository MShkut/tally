// frontend/src/components/gifts/GiftManagement.jsx
import React, { useState, useEffect } from 'react';

import { useTheme } from 'contexts/ThemeContext';
import { ThemeToggle } from 'components/shared/ThemeToggle';
import { 
  FormSection,
  StandardFormLayout,
  SummaryCard,
  EmptyState,
  useItemManager
} from 'components/shared/FormComponents';
import { dataManager } from 'utils/dataManager';
import { BurgerMenu } from 'components/dashboard/BurgerMenu';
import { ContactImport } from './ContactImport';
import { PersonCard } from './PersonCard';
import { GiftBudgetOverview } from './GiftBudgetOverview';
import { PersonEdit } from './PersonEdit';
import { AddPersonManually } from './AddPersonManually';

export const GiftManagement = ({ onNavigate }) => {
  const { isDarkMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState('overview'); // 'overview', 'import', 'edit-person', 'add-person'
  const [giftBudget, setGiftBudget] = useState(0);
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [onboardingData, setOnboardingData] = useState(null);

  useEffect(() => {
    // Load saved data
    const userData = dataManager.loadUserData();
    const giftData = dataManager.loadGiftData();
    
    setOnboardingData(userData);
    
    // Check if gifts category exists and has budget
    const giftCategory = userData?.expenses?.expenseCategories?.find(
      cat => cat.name.toLowerCase() === 'gifts'
    );
    setGiftBudget(parseFloat(giftCategory?.amount) || 0);
    
    // Load people and occasions
    if (giftData) {
      setPeople(giftData.people || []);
    }
  }, []);

  const handleMenuAction = (actionId) => {
    setMenuOpen(false);
    switch (actionId) {
      case 'dashboard':
        onNavigate('dashboard');
        break;
      case 'import':
        onNavigate('import');
        break;
      case 'gifts':
        break; // Already here
      case 'reset-data':
        dataManager.resetAllData();
        onNavigate('onboarding');
        break;
      default:
        console.log(`Action ${actionId} not implemented`);
    }
  };

  const handleContactsImported = (importedContacts) => {
    // Merge with existing people
    const newPeople = importedContacts.map(contact => ({
      id: `person-${Date.now()}-${Math.random()}`,
      name: contact.name,
      relationship: contact.relationship || '',
      birthday: contact.birthday || null,
      email: contact.email || '',
      phone: contact.phone || '',
      notes: contact.notes || '',
      applicableHolidays: ['christmas'], // Default holidays
      budgets: {}, // To be set later
      createdAt: new Date().toISOString()
    }));
    
    const updatedPeople = [...people, ...newPeople];
    setPeople(updatedPeople);
    
    // Save to localStorage
    dataManager.saveGiftData({
      people: updatedPeople,
      occasions: [],
      lastUpdated: new Date().toISOString()
    });
    
    setView('overview');
  };

  const handleEditPerson = (person) => {
    setSelectedPerson(person);
    setView('edit-person');
  };

  const handleSavePerson = (updatedPerson) => {
    const updatedPeople = people.map(p => 
      p.id === updatedPerson.id ? updatedPerson : p
    );
    setPeople(updatedPeople);
    setView('overview');
    setSelectedPerson(null);
  };

  const handleAddPersonManually = (newPerson) => {
    const updatedPeople = [...people, newPerson];
    setPeople(updatedPeople);
    
    // Save to localStorage
    dataManager.saveGiftData({
      people: updatedPeople,
      occasions: [],
      lastUpdated: new Date().toISOString()
    });
    
    setView('overview');
  };

  const handleDeletePerson = (personId) => {
    const updatedPeople = people.filter(p => p.id !== personId);
    setPeople(updatedPeople);
    
    dataManager.saveGiftData({
      people: updatedPeople,
      occasions: [], // TODO: Also filter occasions
      lastUpdated: new Date().toISOString()
    });
  };

  // Calculate gift budget allocation
  const calculateBudgetAllocation = () => {
    const totalPlanned = people.reduce((sum, person) => {
      const personTotal = Object.values(person.budgets || {}).reduce(
        (pSum, amount) => pSum + (parseFloat(amount) || 0), 0
      );
      return sum + personTotal;
    }, 0);
    
    const monthlyGiftBudget = giftBudget;
    const yearlyGiftBudget = monthlyGiftBudget * 12;
    const remaining = yearlyGiftBudget - totalPlanned;
    
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
  if (view === 'import') {
    return (
      <ContactImport 
        onComplete={handleContactsImported}
        onBack={() => setView('overview')}
        existingPeople={people}
      />
    );
  }

  if (view === 'edit-person' && selectedPerson) {
    return (
      <PersonEdit
        person={selectedPerson}
        people={people}
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

  // Main overview
  return (
    <>
      <BurgerMenu 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)}
        onAction={handleMenuAction}
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
              <div className="text-4xl mb-6 opacity-50">🎁</div>
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
                icon="👥"
                title="No recipients yet"
                description="Import contacts or add people manually to start planning gifts"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                {people.map(person => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    onEdit={() => handleEditPerson(person)}
                    onDelete={() => handleDeletePerson(person.id)}
                  />
                ))}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-8 justify-center mt-12">
              <button
                onClick={() => setView('import')}
                className={`
                  text-lg font-light border-b border-transparent hover:border-current pb-1
                  ${isDarkMode 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-black'
                  }
                `}
              >
                Import Contacts
              </button>
              <button
                onClick={() => setView('add-person')}
                className={`
                  text-lg font-light border-b border-transparent hover:border-current pb-1
                  ${isDarkMode 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-600 hover:text-black'
                  }
                `}
              >
                Add Person Manually
              </button>
            </div>
          </FormSection>
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
