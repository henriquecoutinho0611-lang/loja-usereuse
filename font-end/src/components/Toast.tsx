interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  if (!message) return null;

  return (
    <div className="toast" role="status">
      {message}
      <button aria-label="Fechar aviso" onClick={onClose}>×</button>
    </div>
  );
}
