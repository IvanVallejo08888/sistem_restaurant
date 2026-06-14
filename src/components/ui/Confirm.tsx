"use client";
import { Modal } from "./Modal";
import { Button } from "./Button";

export function Confirm({
  open, onClose, onConfirm, title, message, confirmLabel = "Confirmar",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-cocoa/80">{message}</p>
    </Modal>
  );
}
