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
import { SettingsDashboard } from 'components/settings/SettingsDashboard';

// Get household ID from userData
const getHouseholdId = (userData) => {
  if (!userData?.household) return null;

  // Use household.id if it exists (new format)
  if (userData.household.id) {
    return userData.household.id;
  }

  // Migration: Generate ID from household name for existing users
  if (userData.household.name) {
    const migrationId = `household-${userData.household.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    console.log('[MIGRATION] Generating householdId for existing user:', migrationId);
    return migrationId;
  }

  return null;
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
      // Check if the URL household matches the stored household ID
      const householdId = getHouseholdId(userData);
      if (!householdId) {
        console.error('[ROUTER] No householdId found, redirecting to onboarding');
        navigate('/onboarding');
      } else if (household !== householdId) {
        console.log('[ROUTER] Household mismatch, redirecting to:', householdId);
        navigate(`/${householdId}/dashboard`);
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
export const AppRouter = ({ onLogout }) => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Onboarding Route */}
        <Route path="/onboarding" element={<OnboardingRoute />} />

        {/* Protected Routes with household name */}
        <Route path="/:household/*" element={
          <ProtectedRoute>
            <HouseholdRoutes onLogout={onLogout} />
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
    const householdId = data.household?.id;
    if (householdId) {
      navigate(`/${householdId}/dashboard`);
    } else {
      console.error('[ONBOARDING] No householdId in onboarding data');
      navigate('/onboarding');
    }
  };

  return <OnboardingFlow onComplete={handleOnboardingComplete} />;
};

// Household-specific routes
const HouseholdRoutes = ({ onLogout }) => {
  const navigate = useNavigate();
  const { household } = useParams();

  const handleNavigate = (view) => {
    navigate(`/${household}/${view}`);
  };

  return (
    <Routes>
      <Route path="dashboard" element={<Dashboard onNavigate={handleNavigate} onLogout={onLogout} />} />
      <Route path="networth" element={<NetWorthDashboard onNavigate={handleNavigate} onLogout={onLogout} />} />
      <Route path="import" element={<TransactionImport onNavigate={handleNavigate} onLogout={onLogout} />} />
      <Route path="alltransactions" element={<AllTransactions onNavigate={handleNavigate} onLogout={onLogout} />} />
      <Route path="gifts" element={<GiftManagement onNavigate={handleNavigate} onLogout={onLogout} />} />
      <Route path="settings" element={<SettingsDashboard onNavigate={handleNavigate} onLogout={onLogout} />} />
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
    // Check if there's a return path from data import
    const returnPath = sessionStorage.getItem('tally_returnPath');
    if (returnPath) {
      console.log('[ROUTER] Returning to saved path after import:', returnPath);
      sessionStorage.removeItem('tally_returnPath');
      navigate(returnPath);
      setLoading(false);
      return;
    }

    const userData = dataManager.loadUserData();
    if (userData && userData.onboardingComplete) {
      const householdId = getHouseholdId(userData);
      if (householdId) {
        navigate(`/${householdId}/dashboard`);
      } else {
        navigate('/onboarding');
      }
    } else {
      navigate('/onboarding');
    }
    setLoading(false);
  }, [navigate]);

  return loading ? <div>Loading...</div> : null;
};
