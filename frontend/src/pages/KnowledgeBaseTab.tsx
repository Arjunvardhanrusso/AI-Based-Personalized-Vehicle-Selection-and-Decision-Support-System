import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  Copy, 
  Check
} from 'lucide-react';

interface KnowledgeBaseTabProps {
  onLogTelemetry: (msg: string) => void;
}

export const KnowledgeBaseTab: React.FC<KnowledgeBaseTabProps> = ({ onLogTelemetry }) => {
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>('xuv700');
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    ice: true,
    ev: true,
    ontology: true
  });

  const toggleFolder = (key: string) => {
    setExpandedFolders(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const entityDataMap: Record<string, any> = {
    xuv700: {
      "@context": "https://vehicleiq.ai/ontology/v4/automotive.jsonld",
      "entity": "Mahindra XUV700 AX7L AWD",
      "class": "Monocoque Midsize D-SUV",
      "powertrain": "2.0L Turbocharged mStallion Direct Injection (TGDi)",
      "displacementCC": 1997,
      "powerPS": 200,
      "torqueNm": 380,
      "transmission": "Aisin 6-Speed Torque Converter with AWD",
      "baseExShowroomINR": 2485000,
      "globalNCAPRating": {
        "adultStars": 5,
        "adultScore": "16.03/17.00",
        "childStars": 4,
        "structuralIntegrity": "STABLE"
      },
      "activeSafetySuite": "Mobileye EyeQ4 Level-2 ADAS Fusion",
      "groundClearanceMM": 200,
      "testedWadingDepthMM": 450,
      "ruleAssociations": [
        "RULE_F017_MONSOON_WADING",
        "RULE_F024_TAX_GEO_KA",
        "RULE_SAFE_MANDATE"
      ]
    },
    nexon_ev: {
      "@context": "https://vehicleiq.ai/ontology/v4/automotive.jsonld",
      "entity": "Tata Nexon EV Max (40.5kWh)",
      "class": "Compact Electric C-SUV",
      "powertrain": "Permanent Magnet Synchronous Motor (Ziptron)",
      "batteryCapacityKWh": 40.5,
      "batteryChemistry": "Lithium Iron Phosphate (LFP) High Thermal Stability",
      "powerPS": 143,
      "torqueNm": 250,
      "dcFastChargingKW": 50,
      "baseExShowroomINR": 1749000,
      "realWorldGridEfficiencyINRPerKm": 1.20,
      "delhiRoadTaxExemption": true,
      "ruleAssociations": [
        "RULE_F024_DELHI_EV_FREE",
        "RULE_F039_HIGH_RUN_TCO_WIN",
        "RULE_CITY_REGEN_BRAKE"
      ]
    },
    ioniq_5: {
      "@context": "https://vehicleiq.ai/ontology/v4/automotive.jsonld",
      "entity": "Hyundai Ioniq 5 Long Range RWD",
      "class": "Dedicated E-GMP 800V Electric Crossover",
      "powertrain": "Rear-Axle Permanent Magnet Motor",
      "batteryCapacityKWh": 72.6,
      "architectureVoltage": "800V Ultra-Fast DC Architecture",
      "powerPS": 217,
      "torqueNm": 350,
      "wheelbaseMM": 3000,
      "baseExShowroomINR": 4605000,
      "ruleAssociations": [
        "RULE_E_GMP_ULTRA_FAST",
        "RULE_EXECUTIVE_EV_COMFORT"
      ]
    }
  };

  const activeJson = JSON.stringify(entityDataMap[selectedEntityKey] || entityDataMap.xuv700, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeJson);
    setCopied(true);
    onLogTelemetry(`KB_EVENT: JSON schema exported to clipboard for ${selectedEntityKey}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full px-4 lg:px-10 py-6 gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-[#C86B3C]/15 text-[#FF9D66] font-mono text-xs font-semibold border border-[#C86B3C]/30">
            KNOWLEDGE BASE & ONTOLOGY DECK
          </span>
          <span className="text-viq-outline font-mono text-xs">
            W3C JSON-LD / OWL COMPLIANT
          </span>
        </div>
        <h1 className="font-jakarta text-2xl lg:text-3xl font-extrabold text-viq-primary">
          Automotive Knowledge Base & Telemetry Ontology
        </h1>
        <p className="font-jakarta text-sm text-viq-on-surface-variant max-w-4xl leading-relaxed">
          The VehicleIQ knowledge graph models technical relationships between powertrain thermal dynamics, regional RTO taxation structures, crash test telemetry, and real-world multi-attribute utility constraints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-viq-surface-container-low rounded-xl p-4 border border-viq-outline-variant/30 flex flex-col gap-3">
          <span className="font-mono text-xs text-viq-primary uppercase font-bold tracking-wider">
            Domain Ontology Tree
          </span>

          <div className="flex flex-col gap-1 font-mono text-xs">
            <div>
              <button
                onClick={() => toggleFolder('ice')}
                className="w-full py-1.5 px-2 rounded flex items-center gap-2 text-viq-on-surface hover:bg-viq-surface-container transition-colors text-left"
              >
                {expandedFolders.ice ? <FolderOpen className="w-4 h-4 text-amber-400" /> : <Folder className="w-4 h-4 text-amber-400" />}
                <span className="font-semibold">powertrains/ice_turbo</span>
              </button>
              {expandedFolders.ice && (
                <div className="pl-6 flex flex-col gap-1 mt-1 border-l border-viq-outline-variant/30 ml-3">
                  <button
                    onClick={() => {
                      setSelectedEntityKey('xuv700');
                      onLogTelemetry('KB_SELECT: Loaded Mahindra XUV700 telemetry entity');
                    }}
                    className={`py-1 px-2 rounded flex items-center gap-2 text-left transition-colors ${
                      selectedEntityKey === 'xuv700'
                        ? 'bg-viq-primary-container/20 text-viq-primary font-bold'
                        : 'text-viq-on-surface-variant hover:text-viq-on-surface'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>xuv700_ax7l.jsonld</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => toggleFolder('ev')}
                className="w-full py-1.5 px-2 rounded flex items-center gap-2 text-viq-on-surface hover:bg-viq-surface-container transition-colors text-left"
              >
                {expandedFolders.ev ? <FolderOpen className="w-4 h-4 text-[#E68A57]" /> : <Folder className="w-4 h-4 text-[#E68A57]" />}
                <span className="font-semibold">powertrains/electric_bev</span>
              </button>
              {expandedFolders.ev && (
                <div className="pl-6 flex flex-col gap-1 mt-1 border-l border-viq-outline-variant/30 ml-3">
                  <button
                    onClick={() => {
                      setSelectedEntityKey('nexon_ev');
                      onLogTelemetry('KB_SELECT: Loaded Tata Nexon EV Max telemetry entity');
                    }}
                    className={`py-1 px-2 rounded flex items-center gap-2 text-left transition-colors ${
                      selectedEntityKey === 'nexon_ev'
                        ? 'bg-viq-primary-container/20 text-viq-primary-container font-bold'
                        : 'text-viq-on-surface-variant hover:text-viq-on-surface'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>nexon_ev_max.jsonld</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedEntityKey('ioniq_5');
                      onLogTelemetry('KB_SELECT: Loaded Hyundai Ioniq 5 telemetry entity');
                    }}
                    className={`py-1 px-2 rounded flex items-center gap-2 text-left transition-colors ${
                      selectedEntityKey === 'ioniq_5'
                        ? 'bg-viq-primary-container/20 text-viq-primary-container font-bold'
                        : 'text-viq-on-surface-variant hover:text-viq-on-surface'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>hyundai_ioniq5_800v.jsonld</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-viq-surface-container-low rounded-xl p-4 border border-viq-outline-variant/30 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-viq-outline-variant/30 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-viq-tertiary-fixed" />
              <span className="font-mono text-xs font-bold text-viq-primary">
                Ontology Entity Inspector ({selectedEntityKey.toUpperCase()}.jsonld)
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-viq-surface-container hover:bg-viq-surface-container-high text-viq-primary font-mono text-xs border border-viq-outline-variant/40 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-viq-tertiary-fixed" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          <pre className="p-4 bg-viq-surface-container-lowest rounded-lg font-mono text-xs text-viq-tertiary-fixed overflow-x-auto max-h-[420px] leading-relaxed border border-viq-outline-variant/20">
            {activeJson}
          </pre>
        </div>
      </div>
    </div>
  );
};
