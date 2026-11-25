"use client";

import { useState } from "react";
import Modal from "./Modal.js";

export default function ConfirmDelete({ task, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    setDeleting(true);
    await onConfirm(task);
  }

  return (
    <Modal
      title="Usuń zadanie"
      onClose={onClose}
      testId="confirm-delete"
      footer={
        <>
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} autoFocus>Anuluj</button>
          <button type="button" className="btn btn-danger" onClick={confirm} disabled={deleting}>
            {deleting ? "Usuwanie…" : "Usuń"}
          </button>
        </>
      }
    >
      Czy na pewno usunąć zadanie <strong>{task.title}</strong>? Tej operacji nie można cofnąć.
    </Modal>
  );
}
