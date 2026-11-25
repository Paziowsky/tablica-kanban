"use client";

import { useEffect } from "react";

// Bootstrap modal markup driven by React state (no Bootstrap JS). Esc closes it.
export default function Modal({ title, onClose, children, footer, testId }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-testid={testId}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title fs-5" id="modal-title">{title}</h2>
              <button type="button" className="btn-close" aria-label="Zamknij" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">{footer}</div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
