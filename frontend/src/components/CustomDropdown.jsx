import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RiArrowDownSLine, RiCheckLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'motion/react';
import './CustomDropdown.css';

export default function CustomDropdown({
  id,
  label,
  icon: Icon,
  value,
  options = [],
  onChange,
  hasActiveFilter = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [flipUp, setFlipUp] = useState(false);

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const optionsRef = useRef([]);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Measure space and decide whether to flip upwards
  const checkPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const estimatedHeight = Math.min(options.length * 48 + 16, 280);
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < estimatedHeight && rect.top > estimatedHeight) {
        setFlipUp(true);
      } else {
        setFlipUp(false);
      }
    }
  }, [options.length]);

  const toggleDropdown = () => {
    if (!isOpen) {
      checkPosition();
      const currentIndex = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        toggleDropdown();
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1 < options.length ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : options.length - 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex].value);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Keep highlighted item in view during keyboard navigation
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [isOpen, highlightedIndex]);

  return (
    <div
      ref={containerRef}
      className={`custom-dropdown-container ${isOpen ? 'is-open' : ''} ${hasActiveFilter ? 'has-active-filter' : ''}`}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label id={`${id}-label`} className="custom-dropdown-label" htmlFor={`${id}-trigger`}>
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        className="custom-dropdown-trigger"
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label ? `${id}-label ${id}-trigger` : undefined}
      >
        <span className="trigger-left-content">
          {Icon && <Icon className="trigger-icon" aria-hidden="true" />}
          <span className="trigger-selected-label">{selectedOption?.label || 'Select'}</span>
        </span>

        <span className="trigger-right-content">
          {hasActiveFilter && <span className="active-filter-indicator-dot" title="Filter applied" />}
          <RiArrowDownSLine className={`trigger-chevron ${isOpen ? 'rotated' : ''}`} aria-hidden="true" />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            id={`${id}-listbox`}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${id}-label`}
            className={`custom-dropdown-panel ${flipUp ? 'flip-up' : ''}`}
            initial={{ opacity: 0, y: flipUp ? 8 : -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: flipUp ? 6 : -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="custom-dropdown-options-scroll">
              {options.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    ref={(el) => (optionsRef.current[idx] = el)}
                    id={`${id}-opt-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`custom-dropdown-option ${isSelected ? 'selected' : ''} ${
                      isHighlighted ? 'highlighted' : ''
                    }`}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <div className="option-content-left">
                      <span className="option-text">{opt.label}</span>
                    </div>

                    <div className="option-content-right">
                      {typeof opt.count === 'number' && (
                        <span className={`option-count-badge ${opt.badgeClass || ''}`}>
                          {opt.count}
                        </span>
                      )}
                      <span className="option-check-wrap">
                        {isSelected && <RiCheckLine className="option-check-icon" aria-hidden="true" />}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
