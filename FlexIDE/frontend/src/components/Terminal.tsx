import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css"; // Import xterm default styles

const fitAddon = new FitAddon();

function ab2str(buf: string) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

const OPTIONS_TERM = {
  useStyle: true,
  screenKeys: true,
  cursorBlink: true,
  cols: 200,
  theme: {
    background: "#1e1e2f", // Darker background for better contrast
    foreground: "#d4d4d4", // Lighter text for better readability
    cursor: "#00ff00", // Green cursor for a modern terminal feel
    cursorAccent: "#000000",
  },
};

export const TerminalComponent = ({ socket }: { socket: Socket }) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!terminalRef || !terminalRef.current || !socket) {
      return;
    }

    socket.emit("requestTerminal");
    socket.on("terminal", terminalHandler);
    const term = new Terminal(OPTIONS_TERM);
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    function terminalHandler({ data }: { data: ArrayBuffer | string }) {
      if (data instanceof ArrayBuffer) {
        term.write(ab2str(data));
      }
    }

    term.onData((data) => {
      socket.emit("terminalData", { data });
    });

    socket.emit("terminalData", { data: "\n" });

    return () => {
      socket.off("terminal");
      term.dispose(); // Clean up terminal instance
    };
  }, [terminalRef, socket]);

  return (
    <div
      style={{
        width: "100%",
        height: "400px",
        padding: "10px",
        backgroundColor: "#1e1e2f",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        border: "1px solid #444",
        overflow: "hidden",
      }}
      ref={terminalRef}
    />
  );
};
