import React, { useEffect, useState } from 'react';
import { getLogs, clearLogs } from '../utils/debugLogger';

interface LogEntry {
    timestamp: number;
    area: string;
    message: string;
    data?: string | number | boolean | null | undefined | Array<string | number | boolean | null | undefined> | { [key: string]: string | number | boolean | null | undefined } ;
}

const DebugPanel: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setLogs(getLogs());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    zIndex: 9999,
                    padding: '5px',
                    background: '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px'
                }}
            >
                Show Logs
            </button>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '10px',
                right: '10px',
                width: '400px',
                maxHeight: '500px',
                overflowY: 'auto',
                background: '#333',
                color: 'white',
                padding: '10px',
                borderRadius: '5px',
                zIndex: 9999
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>Debug Logs</h3>
                <div>
                    <button
                        onClick={() => clearLogs()}
                        style={{ marginRight: '10px', background: 'red', border: 'none', color: 'white', padding: '5px' }}
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        style={{ background: '#666', border: 'none', color: 'white', padding: '5px' }}
                    >
                        Close
                    </button>
                </div>
            </div>
            {logs.map((log, index) => (
                <div
                    key={index}
                    style={{
                        borderBottom: '1px solid #555',
                        padding: '5px 0',
                        fontSize: '12px'
                    }}
                >
                    <div style={{ color: '#aaa' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                    <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>{log.area}</div>
                    <div>{log.message}</div>
                    {log.data && (
                        <pre style={{ margin: '5px 0', color: '#FFD700' }}>
                            {String(typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2))}
                        </pre>
                    )}
                </div>
            ))}
        </div>
    );
};

export default DebugPanel;
