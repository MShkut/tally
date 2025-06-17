// frontend/src/components/shared/NavigationButtons.jsx
import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '../styled/StyledComponents';

const NavigationButtons = ({ 
  onBack, 
  onNext, 
  canGoNext = true, 
  nextLabel = 'Next',
  backLabel = 'Back',
  showBack = true,
  nextLoading = false,
  useThemeColor = false,
  className = ''
}) => {
  return (
    <div className={`flex justify-between mt-8 ${className}`}>
      {showBack ? (
        <SecondaryButton onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </SecondaryButton>
      ) : (
        <div />
      )}
      
      <PrimaryButton
        onClick={onNext}
        disabled={!canGoNext}
        loading={nextLoading}
        useThemeColor={useThemeColor}
      >
        {!nextLoading && (
          <>
            {nextLabel}
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </PrimaryButton>
    </div>
  );
};

export default NavigationButtons;
