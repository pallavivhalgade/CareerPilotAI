import React, { useEffect, useRef } from 'react';
import Icon from './Icons';

export function Spinner({ label = 'Working' }) {
  return <span className="spinner" role="status" aria-label={label} />;
}

export function Modal({ open, onClose, className = '', children, labelledBy }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  return <dialog ref={ref} className={'modal ' + className} aria-labelledby={labelledBy} onCancel={event => { event.preventDefault(); onClose(); }} onClose={onClose} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
  }}>{children}</dialog>;
}

export function ScoreRing({ value = 0, caption = 'Role fit', large = false }) {
  const number = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  return <div className={'score-ring ' + (large ? 'large' : '')} role="img" aria-label={caption + ': ' + number + ' out of 100'} style={{ '--score': number }}><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="51" /><circle className="score-arc" cx="60" cy="60" r="51" /></svg><div><strong>{number}<small>/100</small></strong><span>{caption}</span></div></div>;
}

export function RichText({ children }) {
  const text = typeof children === 'string' ? children : children ? JSON.stringify(children, null, 2) : '';
  return <div className="rich-text">{text.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph.replace(/^#{1,6}\s+/gm, '').replace(/\*\*([^*]+)\*\*/g, '$1')}</p>)}</div>;
}

export function EmptyState({ icon = 'spark', title, children, action, onAction }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={28} /></span><h3>{title}</h3><p>{children}</p>{action && <button className="button button-dark button-small" onClick={onAction}>{action}<Icon name="arrow" size={16} /></button>}</div>;
}

export function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}
