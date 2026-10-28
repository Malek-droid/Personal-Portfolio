import { useEffect } from "react";

/**
 * Global keyboard shortcut listener for Command Terminal:
 * - Ctrl+K / Cmd+K toggles the terminal overlay
 * - Esc closes it if open
 * Calls preventDefault only for these matching combinations.
 */
export function useCommandTerminalShortcut(
  isOpen: boolean,
  onOpen: () => void,
  onClose: () => void
): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on Ctrl+K / Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          onOpen();
        }
        return;
      }

      // Close on Esc
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onOpen, onClose]);
}
