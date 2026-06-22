import { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: Props): JSX.Element | null {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="lv-sheet-overlay" onClick={onClose} />
      <div className="lv-sheet">
        <div className="lv-sheet-handle" />
        <div className="lv-sheet-header">
          <span className="lv-sheet-title">{title}</span>
          <button className="lv-sheet-close" onClick={onClose}>✕</button>
        </div>
        <div className="lv-sheet-body">{children}</div>
      </div>
    </>
  );
}
