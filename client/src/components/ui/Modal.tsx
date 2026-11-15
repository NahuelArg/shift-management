import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Cantidad de modales abiertos. El scroll del body se bloquea con el primero
// y se libera recién al cerrar el último (evita que un modal pise al otro).
let openModals = 0;

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, size = 'md', className = '' }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Patrón "latest ref": el efecto lee siempre el onClose más reciente sin
  // depender de él, así una función inline no re-suscribe el listener en cada render.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!open) return;

    // 1. Guardar quién tenía el foco para devolvérselo al cerrar
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // 2. Bloquear el scroll del fondo
    openModals += 1;
    document.body.style.overflow = 'hidden';

    // 3. Mover el foco dentro del modal. Con mouse/trackpad, al primer campo;
    //    en pantallas táctiles, al panel (evita que el teclado aparezca de golpe).
    const panel = panelRef.current;
    const hasFinePointer = window.matchMedia?.('(pointer: fine)').matches;
    const firstField = hasFinePointer
      ? panel?.querySelector<HTMLElement>('input, select, textarea')
      : null;
    (firstField ?? panel)?.focus();

    // 4. Escape cierra y Tab queda atrapado dentro del modal (focus trap)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) { e.preventDefault(); return; }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      openModals -= 1;
      if (openModals === 0) document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onCloseRef.current()}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`
          relative w-full ${sizeClasses[size]} bg-surface rounded-t-2xl sm:rounded-2xl
          shadow-modal animate-slide-up sm:animate-fade-in outline-none
          max-h-[90dvh] flex flex-col overflow-hidden ${className}
        `}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 id={titleId} className="text-base font-semibold text-content">{title}</h2>
            <button
              type="button"
              onClick={() => onCloseRef.current()}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-content-3 hover:text-content hover:bg-surface-3 transition-colors"
              aria-label="Cerrar"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
