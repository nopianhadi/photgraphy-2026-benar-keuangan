import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const Modal: React.FC<ModalProps> = React.memo(({ isOpen, onClose, title, children, footer, size = '2xl' }) => {

  // Enhanced keyboard and body scroll handling
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm w-full',
    md: 'max-w-md w-full',
    lg: 'max-w-lg w-full',
    xl: 'max-w-xl w-full',
    '2xl': 'max-w-2xl w-full',
    '3xl': 'max-w-3xl w-full',
    '4xl': 'max-w-4xl w-full',
    '5xl': 'max-w-5xl w-full',
  };

  return createPortal(
    <div
      className="app-modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex justify-center items-center transition-all duration-300 xl:items-start"
      style={{
        zIndex: isOpen ? 60 : -1,
        padding: 'calc(1rem + var(--safe-area-inset-top, 0px)) calc(1rem + var(--safe-area-inset-right, 0px)) calc(1rem + var(--safe-area-inset-bottom, 0px)) calc(1rem + var(--safe-area-inset-left, 0px))',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`
          app-modal-dialog bg-brand-surface text-brand-text-primary 
          rounded-2xl sm:rounded-3xl 
          shadow-2xl 
          ${sizeClasses[size]} 
          flex flex-col 
          transform transition-all duration-300 
          animate-scale-in 
          border border-brand-border/50
          backdrop-blur-xl
        `}
        style={{
          maxHeight: 'calc(100dvh - 2rem - var(--safe-area-inset-top, 0px) - var(--safe-area-inset-bottom, 0px))',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Enhanced Header with better mobile spacing */}
        <div className="
          flex justify-between items-center 
          p-4 sm:p-6 
          border-b border-brand-border/50 
          flex-shrink-0
          bg-brand-surface/90 backdrop-blur-sm
          rounded-t-2xl sm:rounded-t-3xl
        ">
          <h3
            id="modal-title"
            className="
              text-lg sm:text-xl 
              font-semibold 
              text-brand-text-light
              truncate
              pr-4
            "
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="
              text-red-400
              hover:text-white
              active:text-white
              p-2
              rounded-full 
              bg-red-500/10
              hover:bg-red-500
              active:bg-red-600
              transition-all duration-200
              flex-shrink-0
              min-w-[44px] min-h-[44px]
              flex items-center justify-center
              focus:outline-none
              focus:ring-2 focus:ring-red-500/30
              -mr-2
            "
            aria-label="Close modal"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Enhanced Content Area with better scrolling */}
        <div className="
          p-4 sm:p-6 
          overflow-y-auto 
          flex-1
          modal-content-area
          overscroll-contain
          scroll-smooth
        "
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))'
          }}>
          {children}
        </div>

        {/* Enhanced Footer */}
        {footer && (
          <div className="
            flex justify-end items-center 
            p-4 sm:p-6 
            app-modal-footer
            bg-brand-bg/50 
            border-t border-brand-border/50 
            rounded-b-2xl sm:rounded-b-3xl 
            flex-shrink-0
            backdrop-blur-sm
            gap-3
          ">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes scaleIn {
          from { 
            transform: scale(0.95) translateY(10px); 
            opacity: 0; 
          }
          to { 
            transform: scale(1) translateY(0); 
            opacity: 1; 
          }
        }
        
        .animate-scale-in {
          animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        /* ── xl: posisikan dari atas ── */
        @media (min-width: 1280px) {
          .app-modal-overlay {
            align-items: flex-start;
            padding-top: 2rem;
          }
          .app-modal-dialog {
            max-height: calc(100vh - 4rem);
          }
        }

        /* ── Mobile (< 640px): aman terhadap viewport, tanpa padding bottom-nav berlebih ── */
        @media (max-width: 639px) {
          .app-modal-overlay {
            align-items: flex-start;
            padding: 0.75rem !important;
            padding-top: calc(0.75rem + var(--safe-area-inset-top, 0px)) !important;
            padding-bottom: calc(0.75rem + var(--safe-area-inset-bottom, 0px)) !important;
          }

          .app-modal-dialog {
            max-height: calc(100dvh - 1.5rem - var(--safe-area-inset-top, 0px) - var(--safe-area-inset-bottom, 0px)) !important;
            width: 100% !important;
          }

          .modal-content-area {
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
            padding-bottom: 1rem !important;
          }

          .app-modal-footer {
            padding-bottom: calc(0.75rem + var(--safe-area-inset-bottom, 0px)) !important;
          }

          .modal-content-area button[type="submit"],
          .app-modal-footer .button-primary,
          .app-modal-footer .button-secondary,
          .app-modal-footer button {
            min-height: 44px !important;
          }
        }

        /* ── Extra small (< 380px) ── */
        @media (max-width: 379px) {
          .app-modal-overlay {
            padding: 0.5rem !important;
            padding-top: calc(0.5rem + var(--safe-area-inset-top, 0px)) !important;
            padding-bottom: calc(0.5rem + var(--safe-area-inset-bottom, 0px)) !important;
          }

          .app-modal-dialog {
            max-height: calc(100dvh - 1rem - var(--safe-area-inset-top, 0px) - var(--safe-area-inset-bottom, 0px)) !important;
          }
        }
        
        /* Enhanced scrollbar for modal content */
        .modal-content-area::-webkit-scrollbar {
          width: 6px;
        }
        
        .modal-content-area::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .modal-content-area::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 3px;
        }
        
        .modal-content-area::-webkit-scrollbar-thumb:hover {
          background: var(--color-text-secondary);
        }
        
        /* iOS specific optimizations */
        @supports (-webkit-touch-callout: none) {
          .modal-content-area {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </div>,
    document.body
  );
});

export default Modal;