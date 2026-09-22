import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Header } from './components/Header';
import { SubHeader } from './components/SubHeader';
import { TelemetryHUD } from './components/TelemetryHUD';
import { CommandPalette } from './components/CommandPalette';
import { QuestionnaireModal } from './components/QuestionnaireModal';
import { Footer } from './components/Footer';

// Tabs / Pages
import { DiscoverTab } from './pages/DiscoverTab';
import { DetailsTab } from './pages/DetailsTab';
import { KnowledgeBaseTab } from './pages/KnowledgeBaseTab';
import { CompareTab } from './pages/CompareTab';
import { ReasoningTab } from './pages/ReasoningTab';
import AuthPage from './pages/AuthPage';
import GaragePage from './pages/GaragePage';
import AdminDashboard from './pages/AdminDashboard';
import { CompareTab } from './pages/CompareTab';
import { ReasoningTab } from './pages/ReasoningTab';

import type { UserProfile, VehicleRanking, Vehicle, RecommendationResponse, SelectedLocation } from './types';
import { DEFAULT_LOCATION } from './types';
import { fetchVehicles, getRecommendation } from './services/api';

const INITIAL_PROFILE: UserProfile = {
  // Questionnaire fields start empty so they aren't pre-selected
  first_time_owner: undefined,
  experience: undefined,
  driving_confidence: undefined,
  daily_distance: undefined,
  driving_frequency: undefined,
  driving_environment: undefined,
  long_distance_frequency: undefined,
  purchase_budget: undefined,
  running_cost_importance: undefined,
  maintenance_importance: undefined,
  transmission_preference: undefined,
  performance_importance: undefined,
  seating_requirement: undefined,
  boot_space_need: undefined,
  ground_clearance_need: undefined,
  parking: undefined,
  charging_knowledge: undefined,
  fuel_station_access: undefined,
  environmental_preference: undefined,
  vehicle_condition_preference: undefined,
  
  // Default Priorities
  priority_running_cost: 0.6,
  priority_maintenance: 0.5,
  priority_performance: 0.7,
  priority_environment: 0.5,
  priority_purchase_price: 0.6,
  priority_long_distance: 0.8,
  priority_comfort: 0.8
};

export function App() {
  const [activeTab, setActiveTab] = useState<'discover' | 'details' | 'compare' | 'reasoning' | 'knowledge' | 'auth' | 'garage' | 'admin'>('discover');

  // Central location state — single source of truth for the entire app.
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation>(DEFAULT_LOCATION);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [compareSlots, setCompareSlots] = useState<string[]>([]);

  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [rankings, setRankings] = useState<VehicleRanking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState<boolean>(false);

  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] CORE_BOOT: Telemetry node #09941 ready.`,
    `[${new Date().toLocaleTimeString()}] KB_LOAD: 28 forward-chaining rules and Mamdani fuzzy sets initialized.`,
    `[${new Date().toLocaleTimeString()}] GEO_INIT: Location set to ${DEFAULT_LOCATION.city} (${DEFAULT_LOCATION.code}).`
  ]);

  const addTelemetryLog = useCallback((msg: string) => {
    const timeStr = `[${new Date().toLocaleTimeString()}] `;
    setTelemetryLogs(prev => [...prev.slice(-35), timeStr + msg]);
  }, []);

  const handleSetLocation = useCallback((loc: SelectedLocation) => {
    setSelectedLocation(loc);
    addTelemetryLog(`GEO_CHANGE: Location updated to ${loc.city} (${loc.code})`);
  }, [addTelemetryLog]);

  // Handle Ctrl+K / Cmd+K and custom search trigger events
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    const handleOpenSearch = () => setIsCommandPaletteOpen(true);

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('viq:open-search', handleOpenSearch);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('viq:open-search', handleOpenSearch);
    };
  }, []);

  // Initial Fetch of Catalog
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        addTelemetryLog('FETCH_CATALOG: Loading vehicle database & regional price index...');
        const vehList = await fetchVehicles().catch(() => []);
        if (Array.isArray(vehList) && vehList.length > 0) {
          setVehicles(vehList);
          addTelemetryLog(`CATALOG_READY: ${vehList.length} vehicle models indexed.`);
        }
      } catch {
        addTelemetryLog('WARN: Database fetch encountered offline mode, using cached models.');
      }
    };
    loadInitialData();
  }, [addTelemetryLog]);

  // Execute DSS Multi-Attribute Recommendation Calculation
  const runRecommendationInference = useCallback(async () => {
    setLoading(true);
    addTelemetryLog('INFERENCE_START: Executing forward-chaining & fuzzy reasoning pipeline...');
    try {
      // Include location in the profile sent to the recommendation engine
      const profileWithLocation: UserProfile = {
        ...userProfile,
        state: selectedLocation.state,
        city: selectedLocation.city,
      };
      const response: RecommendationResponse = await getRecommendation(profileWithLocation);
      if (response && response.vehicle_rankings && response.vehicle_rankings.length > 0) {
        setRankings(response.vehicle_rankings);
        addTelemetryLog(`INFERENCE_COMPLETE: ${response.vehicle_rankings.length} vehicles scored.`);
      }
    } catch {
      addTelemetryLog('WARN: Backend inference offline; using cached rank vector.');
    } finally {
      setLoading(false);
    }
  }, [userProfile, selectedLocation, addTelemetryLog]);

    // Auto-trigger on mount is removed.
    // Explicit triggers will call runRecommendationInference via onComplete and onRecalculate.

  const handleInspectVehicle = (vehId: string) => {
    setSelectedVehicleId(vehId);
    setActiveTab('details');
    addTelemetryLog(`DEEP_DIVE: Dossier loaded for ${vehId.toUpperCase()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleCompare = (vehId: string) => {
    setCompareSlots(prev => {
      if (prev.includes(vehId)) {
        addTelemetryLog(`COMPARE: Removed ${vehId} from benchmark matrix.`);
        return prev.filter(id => id !== vehId);
      } else {
        if (prev.length >= 4) {
          addTelemetryLog(`COMPARE_LIMIT: Max 4 comparison slots permitted.`);
          return prev;
        }
        addTelemetryLog(`COMPARE: Added ${vehId} to benchmark matrix.`);
        return [...prev, vehId];
      }
    });
  };

  return (
    <Router>
      <div className="min-h-screen bg-viq-background text-viq-on-surface flex flex-col font-sans selection:bg-viq-primary-container/20 selection:text-viq-primary antialiased">
        <Header
          selectedLocation={selectedLocation}
          onOpenSearch={() => setIsCommandPaletteOpen(true)}
        />

        <div className="pt-20">
          <SubHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedLocation={selectedLocation}
            setSelectedLocation={handleSetLocation}
            telemetryOpen={isTelemetryOpen}
            setTelemetryOpen={setIsTelemetryOpen}
            demoMode={demoMode}
            setDemoMode={(demo) => {
              setDemoMode(demo);
              addTelemetryLog(`DEMO_MODE: Set to ${demo ? 'ACTIVE' : 'INACTIVE'}`);
            }}
            onOpenQuestionnaire={() => setIsQuestionnaireOpen(true)}
          />
        </div>

        <main className="flex-1 w-full max-w-[1600px] mx-auto">
          {activeTab === 'discover' && (
            <DiscoverTab
              rankings={rankings}
              vehicles={vehicles}
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              onInspectVehicle={handleInspectVehicle}
              onToggleCompare={handleToggleCompare}
              compareSlots={compareSlots}
              selectedLocation={selectedLocation}
              demoMode={demoMode}
              onOpenQuestionnaire={() => setIsQuestionnaireOpen(true)}
              onLogTelemetry={addTelemetryLog}
              loading={loading}
              onRecalculate={runRecommendationInference}
            />
          )}

          {activeTab === 'details' && (
            <DetailsTab
              vehicleId={selectedVehicleId}
              vehicles={vehicles}
              rankings={rankings}
              selectedLocation={selectedLocation}
              onBackToDiscover={() => setActiveTab('discover')}
              onLogTelemetry={addTelemetryLog}
            />
          )}

          {activeTab === 'compare' && (
            <CompareTab
              compareSlots={compareSlots}
              vehicles={vehicles}
              rankings={rankings}
              onRemoveSlot={(id) => setCompareSlots(prev => prev.filter(s => s !== id))}
              onClearAll={() => {
                setCompareSlots([]);
                addTelemetryLog('COMPARE: Benchmark slots cleared.');
              }}
              onInspectVehicle={handleInspectVehicle}
              selectedLocation={selectedLocation}
            />
          )}

          {activeTab === 'reasoning' && (
            <ReasoningTab onLogTelemetry={addTelemetryLog} />
          )}
        </main>

        <TelemetryHUD
          isOpen={isTelemetryOpen}
          onClose={() => setIsTelemetryOpen(false)}
          logs={telemetryLogs}
          onClearLogs={() => setTelemetryLogs([])}
        />

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={(tab) => setActiveTab(tab)}
          onInspectVehicle={handleInspectVehicle}
        />

        <QuestionnaireModal
          isOpen={isQuestionnaireOpen}
          onClose={() => setIsQuestionnaireOpen(false)}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          onComplete={runRecommendationInference}
          onLogTelemetry={addTelemetryLog}
        />

        <Footer onNavigate={(tab) => setActiveTab(tab)} />
      </div>
    </Router>
  );
}

export default App;
