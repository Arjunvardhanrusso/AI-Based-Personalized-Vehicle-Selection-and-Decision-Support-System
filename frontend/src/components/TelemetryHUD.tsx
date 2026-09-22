import React, { useEffect, useRef } from 'react';
import { Terminal, X, Trash2, Copy, Cpu, Activity } from 'lucide-react';

interface TelemetryHUDProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string[];
  onClearLogs: () => void;
  nodeInfo?: {
    nodeId: string;
    latencyMs: number;
    activeRulesCount: number;
    inferenceState: string;
  };
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
  nodeInfo = {
    nodeId: 'NODE-09941',
    latencyMs: 14,
    activeRulesCount: 28,
    inferenceState: 'SYNCHRONIZED'
  }
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  if (!isOpen) return null;

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
  };

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-[620px] z-50 bg-viq-surface-container-lowest/95 backdrop-blur-xl border border-viq-outline-variant/60 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300">
      {/* HUD Header */}
      <div className="bg-viq-surface-container-high px-4 py-2.5 flex items-center justify-between border-b border-viq-outline-variant/40">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-viq-tertiary-fixed" />
          <span className="font-mono text-xs font-bold text-viq-primary uppercase tracking-wider">
            DSS Telemetry & Inference Console
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-viq-tertiary-container/10 text-viq-tertiary-fixed border border-viq-tertiary-fixed/30">
            LIVE STREAM
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyLogs}
            title="Copy logs to clipboard"
            className="p-1 rounded text-viq-on-surface-variant hover:text-viq-on-surface hover:bg-viq-surface-container transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClearLogs}
            title="Clear console"
            className="p-1 rounded text-viq-on-surface-variant hover:text-viq-error hover:bg-viq-surface-container transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-viq-on-surface-variant hover:text-viq-on-surface hover:bg-viq-surface-container transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-viq-surface-container-low border-b border-viq-outline-variant/30 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-viq-on-surface-variant">
          <Cpu className="w-3 h-3 text-viq-primary-fixed-dim" />
          <span>{nodeInfo.nodeId}</span>
        </div>
        <div className="flex items-center gap-1.5 text-viq-on-surface-variant">
          <Activity className="w-3 h-3 text-viq-tertiary-fixed-dim" />
          <span>{nodeInfo.latencyMs}ms Latency</span>
        </div>
        <div className="text-viq-on-surface-variant">
          <span className="text-viq-primary-fixed">{nodeInfo.activeRulesCount}</span> Rules Active
        </div>
        <div className="text-right text-viq-tertiary-fixed font-semibold">
          ● {nodeInfo.inferenceState}
        </div>
      </div>

      {/* Real-time Log Viewport */}
      <div
        ref={logContainerRef}
        className="p-4 h-48 overflow-y-auto font-mono text-[11px] text-viq-on-surface-variant flex flex-col gap-1.5 bg-viq-surface-container-lowest/80 selection:bg-viq-primary/30"
      >
        {logs.length === 0 ? (
          <div className="text-viq-outline/60 italic py-4 text-center">
            Waiting for inference triggers... Interact with filters, questionnaires, or deep-dive tabs.
          </div>
        ) : (
          logs.map((log, idx) => {
            const isError = log.includes('ERR') || log.includes('FAIL');
            const isSuccess = log.includes('CONFIRM') || log.includes('COMPLETE') || log.includes('MATCH');
            const isRule = log.includes('RULE') || log.includes('INFERENCE') || log.includes('BAYESIAN');

            return (
              <div
                key={idx}
                className={`leading-relaxed border-l-2 pl-2 ${
                  isError
                    ? 'border-viq-error text-viq-error bg-viq-error-container/10'
                    : isSuccess
                    ? 'border-viq-tertiary-fixed text-viq-tertiary'
                    : isRule
                    ? 'border-viq-primary-container text-viq-primary'
                    : 'border-viq-outline-variant text-viq-on-surface-variant'
                }`}
              >
                {log}
              </div>
            );
          })
        )}
      </div>

      {/* HUD Footer status */}
      <div className="px-4 py-1.5 bg-viq-surface-container-high border-t border-viq-outline-variant/30 flex items-center justify-between text-[10px] font-mono text-viq-outline">
        <span>ISO-26262 / FAI L4 Audited Decision Log</span>
        <span>Auto-scroll: ON</span>
      </div>
    </div>
  );
};
