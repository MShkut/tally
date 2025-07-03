import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { dataManager } from 'utils/dataManager';
import { OnboardingFlow } from 'components/setup/OnboardingFlow';
import { Dashboard } from 'components/overview/dashboard/Dashboard';
import { NetWorthDashboard } from 'components/overview/networth/NetWorthDashboard';
import { TransactionImport } from 'components/actions/import/TransactionImport';
import { AllTransactions } from 'components/actions/alltransactions/AllTransactions';
import { GiftManagement } from 'components/actions/gifts/GiftManagement';
import { EditWrapper } from 'components/actions/edit/EditWrapper';
import { PlanNextPeriod } from 'components/actions/plan/PlanNextPeriod';

// Create a household name URL formatter
const formatHouseholdUrl = (name) => {
  if (!name) return 'user';
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const { household } = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = dataManager.loadUserData();
    if (!userData || !userData.onboardingComplete) {
      navigate('/onboarding');
    } else {
      // Check if the URL household matches the stored household
      const urlHousehold = formatHouseholdUrl(userData.household?.name);
      if (household !== urlHousehold) {
        navigate(`/${urlHousehold}/dashboard`);
      } else {
        setIsAuthenticated(true);
      }
    }
    setLoading(false);
  }, [household, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : null;
};

// Main Router Component
export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Onboarding Route */}
        <Route path="/onboarding" element={<OnboardingRoute />} />
        
        {/* Protected Routes with household name */}
        <Route path="/:household/*" element={
          <ProtectedRoute>
            <HouseholdRoutes />
          </ProtectedRoute>
        } />
        
        {/* Default redirect */}
        <Route path="/" element={<DefaultRedirect />} />
      </Routes>
    </BrowserRouter>
  );
};

// Onboarding Route Handler
const OnboardingRoute = () => {
  const navigate = useNavigate();
  
  const handleOnboardingComplete = (data) => {
    const householdUrl = formatHouseholdUrl(data.household?.name);
    navigate(`/${householdUrl}/dashboard`);
  };
  
  return <OnboardingFlow onComplete={handleOnboardingComplete} />;
};

// Household-specific routes
const HouseholdRoutes = () => {
  const navigate = useNavigate();
  const { household } = useParams();
  
  const handleNavigate = (view) => {
    navigate(`/${household}/${view}`);
  };
  
  return (
    <Routes>
      <Route path="dashboard" element={<Dashboard onNavigate={handleNavigate} />} />
      <Route path="networth" element={<NetWorthDashboard onNavigate={handleNavigate} />} />
      <Route path="import" element={<TransactionImport onNavigate={handleNavigate} />} />
      <Route path="alltransactions" element={<AllTransactions onNavigate={handleNavigate} />} />
      <Route path="gifts" element={<GiftManagement onNavigate={handleNavigate} />} />
      <Route path="edit-income" element={
        <EditWrapper 
          editType="income"
          onComplete={() => handleNavigate('dashboard')}
          onCancel={() => handleNavigate('dashboard')}
        />
      } />
      <Route path="edit-savings" element={
        <EditWrapper 
          editType="savingsAllocation"
          onComplete={() => handleNavigate('dashboard')}
          onCancel={() => handleNavigate('dashboard')}
        />
      } />
      <Route path="edit-expenses" element={
        <EditWrapper 
          editType="expenses"
          onComplete={() => handleNavigate('dashboard')}
          onCancel={() => handleNavigate('dashboard')}
        />
      } />
      <Route path="edit-networth" element={
        <EditWrapper 
          editType="netWorth"
          onComplete={() => handleNavigate('dashboard')}
          onCancel={() => handleNavigate('dashboard')}
        />
      } />
      <Route path="plan-next-period" element={
        <PlanNextPeriod 
          onComplete={() => handleNavigate('dashboard')}
          onCancel={() => handleNavigate('dashboard')}
        />
      } />
      {/* Default redirect for household */}
      <Route path="" element={<Navigate to={`/${household}/dashboard`} replace />} />
    </Routes>
  );
};

// Default redirect component
const DefaultRedirect = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const userData = dataManager.loadUserData();
    if (userData && userData.onboardingComplete && userData.household?.name) {
      const householdUrl = formatHouseholdUrl(userData.household.name);
      navigate(`/${householdUrl}/dashboard`);
    } else {
      navigate('/onboarding');
    }
    setLoading(false);
  }, [navigate]);
  
  return loading ? <div>Loading...</div> : null;
};
