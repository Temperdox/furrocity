/**
 * @fileoverview Modal - Accessible modal dialog using Radix UI
 *
 * Features:
 * - Accessible by default (ARIA attributes, focus management)
 * - Escape key to close
 * - Click outside to close
 * - Scroll lock when open
 * - Animated open/close
 *
 * @module components/ui/shared/Modal
 */

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import './Modal.css';

/**
 * Modal - Accessible dialog component
 *
 * @param {boolean} open - Whether the modal is open
 * @param {function} onOpenChange - Callback when open state changes
 * @param {string} title - Modal title (for accessibility)
 * @param {string} description - Modal description (for accessibility)
 * @param {React.ReactNode} children - Modal content
 * @param {string} className - Additional class for the content container
 * @param {string} overlayClassName - Additional class for the overlay
 * @param {boolean} showClose - Whether to show the default close button
 */
const Modal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = '',
  overlayClassName = '',
  showClose = true,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={`modal-overlay ${overlayClassName}`} />
        <Dialog.Content className={`modal-content ${className}`}>
          {title && (
            <Dialog.Title className="modal-title">
              {title}
            </Dialog.Title>
          )}
          {description && (
            <Dialog.Description className="modal-description">
              {description}
            </Dialog.Description>
          )}
          {children}
          {showClose && (
            <Dialog.Close asChild>
              <button className="modal-close-btn" aria-label="Close">
                <span aria-hidden>×</span>
              </button>
            </Dialog.Close>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

/**
 * ModalTrigger - Trigger button for modal
 */
export const ModalTrigger = Dialog.Trigger;

/**
 * ModalClose - Close button wrapper
 */
export const ModalClose = Dialog.Close;

export default Modal;
