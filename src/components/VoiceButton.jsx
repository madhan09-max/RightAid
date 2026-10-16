import React, { useState, useEffect, useRef } from 'react';

/**
 * VoiceButton - Simulates speech-to-text input with animated feedback.
 * 
 * Props:
 * - onResult: (text: string) => void: Callback invoked after simulated speech recognition finishes
 * - simulatedText: string: Predefined text to autofill
 * - disabled?: boolean: Whether the button is disabled
 * - className?: string: Additional custom classes
 */
export default function VoiceButton({ onResult, simulatedText = '', disabled = false, className = '' }) {
  const [isListening, setIsListening] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleClick = (e) => {
    e.preventDefault();
    if (isListening || disabled) return;

    setIsListening(true);

    timerRef.current = setTimeout(() => {
      setIsListening(false);
      if (typeof onResult === 'function') {
        onResult(simulatedText);
      }
    }, 2000);
  };

  return (
    <>
      <style>{`
        @keyframes voiceRipple {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0.25);
            transform: scale(1.08);
          }
          100% {
            box-shadow: 0 0 0 16px rgba(239, 68, 68, 0);
            transform: scale(1);
          }
        }
        .voice-btn-inner {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: #1e3a8a;
          color: #ffffff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          flex-shrink: 0;
        }
        .voice-btn-inner:hover:not(:disabled) {
          background: #1d4ed8;
          transform: scale(1.05);
        }
        .voice-btn-inner:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .voice-btn-inner.listening {
          background: #ef4444 !important;
          animation: voiceRipple 1.2s infinite ease-in-out;
        }
      `}</style>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`voice-btn voice-btn-inner ${isListening ? 'listening' : ''} ${className}`}
        aria-label={isListening ? 'Listening to voice input...' : 'Click to use voice input'}
        title={isListening ? 'Listening...' : 'Simulate voice input'}
      >
        <span className="material-icons" style={{ fontSize: '22px' }}>
          {isListening ? 'mic' : 'mic_none'}
        </span>
      </button>
    </>
  );
}
