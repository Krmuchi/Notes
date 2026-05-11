import React, { useState, useCallback } from "react";

export interface CollapsibleProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
  icon?: string;
}

export function Collapsible({ title, defaultExpanded = false, children, className, icon }: CollapsibleProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div className={`collapsible-container ${className || ""}`}>
      <button
        className={`collapsible-header ${isExpanded ? "expanded" : ""}`}
        onClick={toggle}
      >
        <span className="collapsible-icon">
          {isExpanded ? "▼" : "▶"}
        </span>
        {icon && <span className="collapsible-custom-icon">{icon}</span>}
        <span className="collapsible-title">{title}</span>
      </button>
      <div className={`collapsible-content ${isExpanded ? "expanded" : "collapsed"}`}>
        {children}
      </div>
    </div>
  );
}

export interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  icon?: string;
}

export interface AccordionProps {
  items: AccordionItemProps[];
  defaultOpenIndex?: number;
  allowMultipleOpen?: boolean;
}

export function Accordion({ items, defaultOpenIndex = -1, allowMultipleOpen = false }: AccordionProps) {
  const [openIndices, setOpenIndices] = useState<number[]>(
    defaultOpenIndex >= 0 ? [defaultOpenIndex] : []
  );

  const toggleItem = useCallback((index: number) => {
    setOpenIndices((prev) => {
      if (allowMultipleOpen) {
        if (prev.includes(index)) {
          return prev.filter((i) => i !== index);
        }
        return [...prev, index];
      }
      return prev.includes(index) ? [] : [index];
    });
  }, [allowMultipleOpen]);

  return (
    <div className="accordion-container">
      {items.map((item, index) => (
        <div key={index} className="accordion-item">
          <button
            className={`accordion-header ${openIndices.includes(index) ? "expanded" : ""}`}
            onClick={() => toggleItem(index)}
          >
            <span className="accordion-icon">
              {openIndices.includes(index) ? "▼" : "▶"}
            </span>
            {item.icon && <span className="accordion-custom-icon">{item.icon}</span>}
            <span className="accordion-title">{item.title}</span>
          </button>
          <div className={`accordion-content ${openIndices.includes(index) ? "expanded" : "collapsed"}`}>
            {item.children}
          </div>
        </div>
      ))}
    </div>
  );
}