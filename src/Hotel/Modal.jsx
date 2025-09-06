import React, { useEffect, useCallback } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './Modal.css';

const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'medium',
  showHeader = true,
  showFooter = false,
  footerContent,
  closeOnOverlayClick = true,
  showCloseButton = true,
  isRounded = true,
  overlayBlur = true,
  animationType = 'fade',
  onConfirm,
  confirmText = 'Confirm',
  showConfirmButton = false,
  showCancelButton = false,
  cancelText = 'Cancel',
  isScrollable = false,
  fullScreenOnMobile = true,
  showNavigation = false,
  onNext,
  onPrevious,
  currentStep,
  totalSteps
}) => {
  const handleEscapeKey = useCallback((event) => {
    if (event.keyCode === 27) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey, false);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey, false);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscapeKey]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className={`modal-overlay ${overlayBlur ? 'overlay-blur' : ''} ${animationType}`}>
      <div 
        className={`
          modal-content 
          modal-${size} 
          ${isRounded ? 'rounded' : ''}
          ${fullScreenOnMobile ? 'mobile-fullscreen' : ''}
          ${isScrollable ? 'scrollable' : ''}
        `}
        onClick={e => e.stopPropagation()}
      >
        {showHeader && (
          <div className="modal-header">
            {showNavigation && currentStep > 1 && (
              <button className="modal-nav-button prev" onClick={onPrevious}>
                <FaChevronLeft />
              </button>
            )}
            
            <div className="modal-title">
              <h3>{title}</h3>
              {showNavigation && totalSteps > 1 && (
                <span className="modal-step-indicator">Step {currentStep} of {totalSteps}</span>
              )}
            </div>
            
            {showCloseButton && (
              <button className="modal-close" onClick={onClose} aria-label="Close modal">
                <FaTimes />
              </button>
            )}
            
            {showNavigation && currentStep < totalSteps && (
              <button className="modal-nav-button next" onClick={onNext}>
                <FaChevronRight />
              </button>
            )}
          </div>
        )}
        
        <div className="modal-body">
          {children}
        </div>
        
        {(showFooter || showConfirmButton || showCancelButton || footerContent) && (
          <div className="modal-footer">
            {footerContent || (
              <>
                {showCancelButton && (
                  <button className="modal-button cancel" onClick={onClose}>
                    {cancelText}
                  </button>
                )}
                {showConfirmButton && (
                  <button className="modal-button confirm" onClick={onConfirm}>
                    {confirmText}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;