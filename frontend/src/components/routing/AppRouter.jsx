import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { apiService } from 'utils/apiService';

// Lazy load all route components for better performance
const OnboardingFlow = lazy(() => import('components/setup/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })));
const Dashboard = lazy(() => import('components/overview/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const TransactionImport = lazy(() => import('components/actions/import/TransactionImport').then(m => ({ default: m.TransactionImport })));
const AllTransactions = lazy(() => import('components/actions/alltransactions/AllTransactions').then(m => ({ default: m.AllTransactions })));
const EditWrapper = lazy(() => import('components/actions/edit/EditWrapper').then(m => ({ default: m.EditWrapper })));
const PlanNextPeriod = lazy(() => import('components/actions/plan/PlanNextPeriod').then(m => ({ default: m.PlanNextPeriod })));
const SettingsDashboard = lazy(() => import('components/settings/SettingsDashboard').then(m => ({ default: m.SettingsDashboard })));

// Loading component for suspense
const LoadingFallback = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-white text-lg">Loading...</div>
  </div>
);

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
    const checkAuth = async () => {
      try {
        const userData = await apiService.loadUserData();
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
      } catch (error) {
        console.error('[ROUTER] Error loading user data:', error);
        navigate('/onboarding');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
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
    console.log('[ONBOARDING] Completion data:', data);

    // Use same logic as getHouseholdId()
    let householdId = data.household?.id;

    // Fallback: generate ID from household name
    if (!householdId && data.household?.name) {
      householdId = `household-${data.household.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      console.log('[ONBOARDING] Generated householdId from name:', householdId);
    }

    if (householdId) {
      console.log('[ONBOARDING] Navigating to:', `/${householdId}/dashboard`);
      navigate(`/${householdId}/dashboard`);
    } else {
      console.error('[ONBOARDING] No householdId in onboarding data');
      navigate('/onboarding');
    }
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      <OnboardingFlow onComplete={handleOnboardingComplete} />
    </Suspense>
  );
};

// Household-specific routes
const HouseholdRoutes = ({ onLogout }) => {
  const navigate = useNavigate();
  const { household } = useParams();

  const handleNavigate = (view) => {
    navigate(`/${household}/${view}`);
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="dashboard" element={<Dashboard onNavigate={handleNavigate} onLogout={onLogout} />} />
        <Route path="import" element={<TransactionImport onNavigate={handleNavigate} onLogout={onLogout} />} />
        <Route path="alltransactions" element={<AllTransactions onNavigate={handleNavigate} onLogout={onLogout} />} />
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
        <Route path="plan-next-period" element={
          <PlanNextPeriod
            onComplete={() => handleNavigate('dashboard')}
            onCancel={() => handleNavigate('dashboard')}
          />
        } />
        {/* Default redirect for household */}
        <Route path="" element={<Navigate to={`/${household}/dashboard`} replace />} />
      </Routes>
    </Suspense>
  );
};

// Default redirect component
const DefaultRedirect = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirect = async () => {
      try {
        // Check if there's a return path from data import
        const returnPath = sessionStorage.getItem('tally_returnPath');
        if (returnPath) {
          console.log('[ROUTER] Returning to saved path after import:', returnPath);
          sessionStorage.removeItem('tally_returnPath');
          navigate(returnPath);
          setLoading(false);
          return;
        }

        const userData = await apiService.loadUserData();
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
      } catch (error) {
        console.error('[ROUTER] Error loading user data:', error);
        navigate('/onboarding');
      } finally {
        setLoading(false);
      }
    };

    redirect();
  }, [navigate]);

  return loading ? <div>Loading...</div> : null;
};
