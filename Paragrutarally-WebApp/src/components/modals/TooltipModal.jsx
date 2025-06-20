// src/components/modals/TooltipModal.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './TooltipModal.css';

const TooltipModal = ({
                          isOpen,
                          title,
                          description,
                          action,
                          mousePosition,
                          onClose
                      }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (isOpen && mousePosition) {
            // Position the modal above and slightly to the right of cursor
            // Add offsets to prevent it from appearing directly under cursor
            const offsetX = 15;
            const offsetY = -10;

            // Get viewport dimensions to prevent modal from going off-screen
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Estimate modal dimensions (we'll adjust if needed)
            const modalWidth = 320;
            const modalHeight = 150;

            let x = mousePosition.x + offsetX;
            let y = mousePosition.y + offsetY;

            // Prevent modal from going off the right edge
            if (x + modalWidth > viewportWidth) {
                x = mousePosition.x - modalWidth - offsetX;
            }

            // Prevent modal from going off the top edge
            if (y - modalHeight < 0) {
                y = mousePosition.y + offsetY + 30; // Position below cursor instead
            }

            // Prevent modal from going off the bottom edge
            if (y + modalHeight > viewportHeight) {
                y = viewportHeight - modalHeight - 10;
            }

            // Prevent modal from going off the left edge
            if (x < 10) {
                x = 10;
            }

            setPosition({ x, y });
        }
    }, [isOpen, mousePosition]);

    if (!isOpen) return null;

    const modalContent = (
        <div
            className="tooltip-modal-overlay"
            onClick={onClose}
        >
            <div
                className="tooltip-modal"
                style={{
                    position: 'fixed',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    zIndex: 9999999
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="tooltip-modal-content">
                    {title && <div className="tooltip-modal-title">{title}</div>}
                    {description && <div className="tooltip-modal-description">{description}</div>}
                    {action && <div className="tooltip-modal-action">💡 {action}</div>}
                </div>
            </div>
        </div>
    );

    // Render modal at document root to avoid z-index issues
    return createPortal(modalContent, document.body);
};

export default TooltipModal;