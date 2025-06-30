// frontend/src/components/gifts/GiftBudgetOverview.jsx
import React from 'react';

import { 
  FormSection,
  SummaryCard
} from 'components/shared/FormComponents';

export const GiftBudgetOverview = ({ budgetInfo }) => {
  const { monthlyBudget, yearlyBudget, allocated, remaining, peopleCount } = budgetInfo;
  const percentAllocated = yearlyBudget > 0 ? (allocated / yearlyBudget) * 100 : 0;
  
  return (
    <FormSection>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <SummaryCard
          title="Monthly Gift Budget"
          value={monthlyBudget}
          subtitle="From expense category"
        />
        <SummaryCard
          title="Annual Gift Budget"
          value={yearlyBudget}
          subtitle="Total for the year"
          accent={true}
        />
        <SummaryCard
          title="Already Allocated"
          value={allocated}
          subtitle={`${percentAllocated.toFixed(0)}% of annual`}
        />
        <SummaryCard
          title="Remaining to Plan"
          value={remaining}
          subtitle={remaining < 0 ? 'Over budget!' : peopleCount > 0 ? `For ${peopleCount} people` : 'Add recipients'}
        />
      </div>
    </FormSection>
  );
};
