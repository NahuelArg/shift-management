import React, { useEffect, useState } from 'react';

interface LogEntry {
  timestamp: number;
  area: string;
  message: string;
  data?: {
    [key: string]: string | number | boolean | null | undefined |
      Array<string | number | boolean | null | undefined> |
      { [key: string]: string | number | boolean | null | undefined }
  } | string | number | boolean | null;
}

export const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Suscribirse a eventos de log
    const handleLog = (event: CustomEvent<LogEntry>) => {
      setLogs(prevLogs => [...prevLogs, event.detail]);
    };

    window.addEventListener('debug-log', handleLog as EventListener);

    return () => {
      window.removeEventListener('debug-log', handleLog as EventListener);
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg"
        style={{ zIndex: 1000 }}
      >
        Show Debug Console
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-96 h-96 bg-gray-900 text-white p-4 overflow-auto"
         style={{ zIndex: 1000 }}>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 text-white hover:text-gray-300"
      >
        ✕
      </button>
      <h3 className="text-lg font-bold mb-2">Debug Console</h3>
      <div className="space-y-2">
        {logs.map((log, index) => (
          <div key={index} className="border-b border-gray-700 pb-2">
            <div className="text-xs text-gray-400">
              {new Date(log.timestamp).toISOString()} - {log.area}
            </div>
            <div className="text-sm">{log.message}</div>
            {log.data && (
              <pre className="text-xs bg-gray-800 p-2 mt-1 rounded overflow-x-auto">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
