import React from 'react';

/**
 * Visual Progress Stepper for Application Lifecycle Tracking (Pillar 4)
 * 
 * @param {Object} props
 * @param {string} props.currentStage - 'data_collected' | 'validation_passed' | 'caseworker_review' | 'submitted_esevai'
 * @param {string} props.language - 'en' | 'ta' | 'hi'
 */
export default function LifecycleTracker({ currentStage = 'data_collected', language = 'en' }) {
  const stages = [
    {
      id: 'data_collected',
      icon: 'assignment_turned_in',
      label: {
        en: 'Data Collected',
        ta: 'தரவு சேகரிக்கப்பட்டது',
        hi: 'डेटा एकत्र किया गया'
      }
    },
    {
      id: 'validation_passed',
      icon: 'verified',
      label: {
        en: 'Validation Passed',
        ta: 'சரிபார்ப்பு வெற்றி',
        hi: 'सत्यापन सफल'
      }
    },
    {
      id: 'caseworker_review',
      icon: 'support_agent',
      label: {
        en: 'Caseworker Review',
        ta: 'களப்பணியாளர் மதிப்பாய்வு',
        hi: 'कार्यकर्ता समीक्षा'
      }
    },
    {
      id: 'submitted_esevai',
      icon: 'cloud_done',
      label: {
        en: 'Submitted to e-Sevai',
        ta: 'e-Sevai-க்கு சமர்ப்பிக்கப்பட்டது',
        hi: 'ई-सेवई में जमा'
      }
    }
  ];

  let currentIndex = stages.findIndex(s => s.id === currentStage);
  if (currentIndex === -1) {
    currentIndex = 0;
  }

  return (
    <nav 
      className="lifecycle-tracker" 
      aria-label="Application progress stepper"
      role="navigation"
    >
      {stages.map((stage, idx) => {
        let stepStatus = 'future';
        if (idx < currentIndex) {
          stepStatus = 'completed';
        } else if (idx === currentIndex) {
          stepStatus = 'current';
        }

        const isLast = idx === stages.length - 1;
        const nextConnectorCompleted = idx < currentIndex;

        const localizedLabel = stage.label[language] || stage.label.en;

        return (
          <React.Fragment key={stage.id}>
            <div className="lifecycle-step" aria-current={stepStatus === 'current' ? 'step' : undefined}>
              <div 
                className={`lifecycle-step-circle ${stepStatus}`}
                title={`${localizedLabel} (${stepStatus})`}
              >
                <span className="material-icons" aria-hidden="true">
                  {stage.icon}
                </span>
              </div>
              <span className={`lifecycle-step-label ${stepStatus}`}>
                {localizedLabel}
              </span>
            </div>

            {!isLast && (
              <div 
                className={`lifecycle-connector ${nextConnectorCompleted ? 'completed' : 'future'}`} 
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
