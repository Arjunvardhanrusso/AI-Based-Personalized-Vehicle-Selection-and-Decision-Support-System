import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Filter,
  Fuel,
  GitBranch,
  Layers,
  Search,
  ShieldCheck,
  X,
  Zap
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchBayesianPriors,
  fetchFuzzySets,
  fetchRules,
  fetchVehicles,
} from '../services/api';
import type { Vehicle } from '../types';
import { VehicleImage } from '../components/VehicleImage';

type Tab =
  | 'vehicles'
  | 'ontology'
  | 'rules'
  | 'fuzzy'
  | 'bayesian'
  | 'health';

type AnyRecord = Record<string, any>;

const formatPrice = (value: number | undefined | null) => {
  if (!Number.isFinite(value)) return 'Price unavailable';

  const price = Number(value);

  if (price < 100000) {
    return `₹${price.toLocaleString('en-IN')}`;
  }

  if (price < 10000000) {
    const lakh = price / 100000;
    return `₹${lakh.toFixed(lakh >= 10 ? 1 : 2)}L`;
  }

  const crore = price / 10000000;
  return `₹${crore.toFixed(crore >= 10 ? 1 : 2)}Cr`;
};

const formatExactPrice = (value: number | undefined | null) => {
  if (!Number.isFinite(value)) return 'Price unavailable';
  return `₹${Number(value).toLocaleString('en-IN')}`;
};

const normalize = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const titleCase = (value: unknown) =>
  String(value ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getVehicleImage = (vehicle: AnyRecord) =>
  vehicle.image_url ||
  vehicle.image_path ||
  vehicle.image ||
  '/assets/cars/default_vehicle.svg';

const getMarketLabel = (vehicle: AnyRecord) =>
  vehicle.is_used ? 'USED' : 'NEW';

const getPriceLabel = (vehicle: AnyRecord) =>
  vehicle.is_used ? 'USED MARKET PRICE' : 'EX-SHOWROOM PRICE';

const Stat = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="rounded-xl border border-white/[0.06] bg-[#0B0B0B] p-3">
    <div className="mb-1 text-[9px] font-mono uppercase tracking-[0.14em] text-[#737373]">
      {label}
    </div>
    <div className="text-sm font-medium text-[#F5F3EE]">{value}</div>
  </div>
);

const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-[#0A0A0A]">
    <div className="max-w-md px-6 text-center">
      <Database className="mx-auto mb-4 h-8 w-8 text-[#C86B3C]" />
      <h3 className="text-sm font-semibold text-[#F5F3EE]">{title}</h3>
      <p className="mt-2 text-xs leading-6 text-[#737373]">{description}</p>
    </div>
  </div>
);

const SectionTitle = ({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) => (
  <div>
    <div className="mb-1 text-[9px] font-mono uppercase tracking-[0.18em] text-[#C86B3C]">
      {eyebrow}
    </div>
    <h2 className="text-lg font-semibold tracking-tight text-[#F5F3EE]">
      {title}
    </h2>
    {description && (
      <p className="mt-1 max-w-3xl text-xs leading-5 text-[#737373]">
        {description}
      </p>
    )}
  </div>
);

const VehicleInspector = ({
  vehicle,
  onClose,
}: {
  vehicle: AnyRecord;
  onClose: () => void;
}) => {
  const image = getVehicleImage(vehicle);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0C0C0C] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg border border-white/[0.08] bg-[#111111] p-2 text-[#A3A3A3] transition hover:text-[#F5F3EE]"
          aria-label="Close vehicle inspector"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid lg:grid-cols-[360px_1fr]">
          <div className="border-b border-white/[0.06] bg-[#090909] p-5 lg:border-b-0 lg:border-r">
            <div className="aspect-[4/3] overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] flex items-center justify-center p-2">
              <VehicleImage
                src={image}
                vehicleId={vehicle.id}
                brand={vehicle.brand}
                model={vehicle.name}
                bodyType={vehicle.vehicle_segment || vehicle.segment || vehicle.body_type}
                alt={vehicle.name || 'Vehicle'}
                className="w-full h-full bg-transparent"
                showAttribution={true}
              />
            </div>

            <div className="mt-5">
              <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-[#737373]">
                {vehicle.brand || 'Unknown brand'}
              </div>

              <h2 className="mt-1 text-xl font-semibold text-[#F5F3EE]">
                {vehicle.name || 'Unnamed vehicle'}
              </h2>

              {vehicle.variant && (
                <div className="mt-1 text-xs text-[#A3A3A3]">
                  {vehicle.variant}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-md border border-[#C86B3C]/30 bg-[#18110D] px-2 py-1 text-[9px] font-mono uppercase text-[#E59A72]">
                  {getMarketLabel(vehicle)}
                </span>

                {vehicle.fuel_type && (
                  <span className="rounded-md border border-white/[0.07] bg-[#151515] px-2 py-1 text-[9px] font-mono uppercase text-[#A3A3A3]">
                    {vehicle.fuel_type}
                  </span>
                )}
              </div>

              <div className="mt-6 border-t border-white/[0.06] pt-5">
                <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-[#737373]">
                  {getPriceLabel(vehicle)}
                </div>

                <div className="mt-1 text-2xl font-semibold text-[#F5F3EE]">
                  {formatExactPrice(vehicle.price_inr)}
                </div>

                {vehicle.is_used && (
                  <div className="mt-2 text-[10px] leading-5 text-[#737373]">
                    This value represents the used-market/listed price. It is
                    not an ex-showroom price.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-7 p-5 sm:p-7">
            <div>
              <SectionTitle
                eyebrow="Entity Inspector"
                title="Vehicle Knowledge Record"
                description="Inspect the structured facts currently associated with this vehicle."
              />

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                <Stat label="Vehicle ID" value={vehicle.id || '—'} />
                <Stat label="Brand" value={vehicle.brand || '—'} />
                <Stat label="Model" value={vehicle.name || '—'} />
                <Stat label="Variant" value={vehicle.variant || '—'} />
                <Stat
                  label="Market"
                  value={vehicle.is_used ? 'Used' : 'New'}
                />
                <Stat
                  label="Powertrain"
                  value={vehicle.powertrain || vehicle.fuel_type || '—'}
                />
              </div>
            </div>

            <div>
              <SectionTitle
                eyebrow="Ontology"
                title="Vehicle Classification"
              />

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                <Stat
                  label="Body Type"
                  value={titleCase(vehicle.body_type || vehicle.vehicle_segment)}
                />
                <Stat
                  label="Vehicle Type"
                  value={titleCase(vehicle.vehicle_type)}
                />
                <Stat
                  label="Performance Type"
                  value={titleCase(vehicle.performance_type)}
                />
                <Stat
                  label="Luxury Level"
                  value={vehicle.luxury_level ?? '—'}
                />
                <Stat
                  label="Off-Road Capability"
                  value={vehicle.offroad_capability ?? '—'}
                />
                <Stat
                  label="Fuel Type"
                  value={titleCase(vehicle.fuel_type)}
                />
              </div>
            </div>

            <div>
              <SectionTitle eyebrow="Specifications" title="Physical & Usage Facts" />

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat
                  label="Seating"
                  value={
                    vehicle.seating_capacity
                      ? `${vehicle.seating_capacity} seats`
                      : '—'
                  }
                />
                <Stat
                  label="Ground Clearance"
                  value={
                    vehicle.ground_clearance_mm
                      ? `${vehicle.ground_clearance_mm} mm`
                      : '—'
                  }
                />
                <Stat
                  label="Boot Space"
                  value={
                    vehicle.boot_space_litres
                      ? `${vehicle.boot_space_litres} L`
                      : '—'
                  }
                />
                <Stat
                  label="Running Cost"
                  value={
                    vehicle.running_cost_per_km != null
                      ? `₹${vehicle.running_cost_per_km}/km`
                      : '—'
                  }
                />
                <Stat
                  label="Maintenance"
                  value={vehicle.maintenance_index ?? '—'}
                />
                <Stat
                  label="Performance"
                  value={vehicle.performance_score ?? '—'}
                />
                <Stat
                  label="Transmission"
                  value={titleCase(vehicle.transmission)}
                />
                <Stat
                  label="City"
                  value={vehicle.city || vehicle.location || '—'}
                />
              </div>
            </div>

            {vehicle.is_used && (
              <div>
                <SectionTitle
                  eyebrow="Used Market"
                  title="Pre-Owned Facts"
                  description="These fields are intentionally separated from new-vehicle pricing."
                />

                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Stat
                    label="Year"
                    value={
                      vehicle.manufacture_year ||
                      vehicle.registration_year ||
                      '—'
                    }
                  />
                  <Stat
                    label="Kilometres"
                    value={
                      vehicle.kilometres_driven != null
                        ? `${Number(
                          vehicle.kilometres_driven
                        ).toLocaleString('en-IN')} km`
                        : '—'
                    }
                  />
                  <Stat
                    label="Condition"
                    value={titleCase(vehicle.condition)}
                  />
                  <Stat
                    label="Market Status"
                    value="Pre-Owned"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const VehicleCard = ({
  vehicle,
  onInspect,
}: {
  vehicle: AnyRecord;
  onInspect: (vehicle: AnyRecord) => void;
}) => (
  <button
    onClick={() => onInspect(vehicle)}
    className="group w-full rounded-2xl border border-white/[0.06] bg-[#101010] p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#C86B3C]/30 hover:bg-[#131313]"
  >
    <div className="aspect-[16/9] overflow-hidden rounded-xl border border-white/[0.05] bg-[#080808] flex items-center justify-center p-2">
      <VehicleImage
        src={getVehicleImage(vehicle)}
        vehicleId={vehicle.id}
        brand={vehicle.brand}
        model={vehicle.name}
        bodyType={vehicle.vehicle_segment || vehicle.segment || vehicle.body_type}
        alt={vehicle.name || 'Vehicle'}
        className="w-full h-full bg-transparent"
        imageClassName="transition duration-500 group-hover:scale-[1.025]"
      />
    </div>

    <div className="mt-4 flex items-start justify-between gap-3">
      <div>
        <div className="text-[9px] font-mono uppercase tracking-[0.15em] text-[#737373]">
          {vehicle.brand || 'Unknown'}
        </div>
        <div className="mt-1 text-sm font-semibold text-[#F5F3EE]">
          {vehicle.name || 'Unnamed Vehicle'}
        </div>
      </div>

      <ChevronRight className="mt-1 h-4 w-4 text-[#525252] transition group-hover:translate-x-0.5 group-hover:text-[#C86B3C]" />
    </div>

    <div className="mt-3 flex flex-wrap gap-1.5">
      <span className="rounded-md bg-[#191919] px-2 py-1 text-[9px] font-mono uppercase text-[#A3A3A3]">
        {getMarketLabel(vehicle)}
      </span>

      {vehicle.fuel_type && (
        <span className="rounded-md bg-[#191919] px-2 py-1 text-[9px] font-mono uppercase text-[#A3A3A3]">
          {vehicle.fuel_type}
        </span>
      )}

      {vehicle.body_type && (
        <span className="rounded-md bg-[#191919] px-2 py-1 text-[9px] font-mono uppercase text-[#A3A3A3]">
          {vehicle.body_type}
        </span>
      )}
    </div>

    <div className="mt-4 flex items-end justify-between border-t border-white/[0.05] pt-3">
      <div>
        <div className="text-[9px] font-mono uppercase tracking-wider text-[#737373]">
          {getPriceLabel(vehicle)}
        </div>
        <div className="mt-0.5 text-base font-semibold text-[#F5F3EE]">
          {formatPrice(vehicle.price_inr)}
        </div>
      </div>

      <div className="text-[9px] font-mono uppercase tracking-wider text-[#C86B3C]">
        Inspect
      </div>
    </div>
  </button>
);

const OntologyTab = ({ vehicles }: { vehicles: AnyRecord[] }) => {
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const hierarchy = useMemo(() => {
    const result: Record<string, Record<string, AnyRecord[]>> = {};

    vehicles.forEach((vehicle) => {
      const brand = vehicle.brand || 'Unknown Brand';
      const model = vehicle.model_family || vehicle.name || 'Unknown Model';

      if (!result[brand]) result[brand] = {};
      if (!result[brand][model]) result[brand][model] = [];

      result[brand][model].push(vehicle);
    });

    return result;
  }, [vehicles]);

  return (
    <div className="space-y-5">
      <SectionTitle
        eyebrow="Knowledge Representation"
        title="Vehicle Ontology"
        description="Hierarchical representation of Brand → Model Family → Model/Variant."
      />

      <div className="rounded-2xl border border-white/[0.06] bg-[#0C0C0C]">
        {Object.keys(hierarchy).length === 0 ? (
          <EmptyState
            title="No ontology entities"
            description="The current vehicle dataset did not return any records."
          />
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {Object.entries(hierarchy).map(([brand, models]) => {
              const brandOpen = expandedBrand === brand;

              return (
                <div key={brand}>
                  <button
                    onClick={() =>
                      setExpandedBrand(brandOpen ? null : brand)
                    }
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-[#111111]"
                  >
                    {brandOpen ? (
                      <ChevronDown className="h-4 w-4 text-[#C86B3C]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#737373]" />
                    )}

                    <div className="flex-1">
                      <div className="text-sm font-semibold text-[#F5F3EE]">
                        {brand}
                      </div>
                      <div className="mt-0.5 text-[10px] text-[#737373]">
                        {Object.keys(models).length} model families
                      </div>
                    </div>

                    <div className="rounded-md bg-[#181818] px-2 py-1 text-[9px] font-mono text-[#A3A3A3]">
                      BRAND
                    </div>
                  </button>

                  {brandOpen && (
                    <div className="border-t border-white/[0.04] bg-[#090909] px-5 py-2">
                      {Object.entries(models).map(([model, variants]) => {
                        const key = `${brand}:${model}`;
                        const modelOpen = expandedModel === key;

                        return (
                          <div key={key}>
                            <button
                              onClick={() =>
                                setExpandedModel(modelOpen ? null : key)
                              }
                              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-[#111111]"
                            >
                              {modelOpen ? (
                                <ChevronDown className="h-3.5 w-3.5 text-[#C86B3C]" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-[#525252]" />
                              )}

                              <div className="flex-1">
                                <div className="text-xs font-medium text-[#F5F3EE]">
                                  {model}
                                </div>
                                <div className="mt-0.5 text-[10px] text-[#737373]">
                                  {variants.length} records
                                </div>
                              </div>

                              <div className="rounded-md border border-white/[0.05] px-2 py-1 text-[9px] font-mono text-[#737373]">
                                MODEL
                              </div>
                            </button>

                            {modelOpen && (
                              <div className="ml-8 space-y-2 pb-3">
                                {variants.map((variant) => (
                                  <div
                                    key={variant.id}
                                    className="rounded-xl border border-white/[0.05] bg-[#111111] p-3"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <div className="text-xs font-medium text-[#F5F3EE]">
                                          {variant.variant ||
                                            variant.name ||
                                            'Unnamed variant'}
                                        </div>
                                        <div className="mt-1 text-[10px] font-mono text-[#737373]">
                                          {variant.id}
                                        </div>
                                      </div>

                                      <ArrowRight className="h-3.5 w-3.5 text-[#C86B3C]" />
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <span className="text-[9px] font-mono uppercase text-[#737373]">
                                        {titleCase(
                                          variant.body_type ||
                                          variant.vehicle_segment
                                        )}
                                      </span>

                                      <span className="text-[9px] font-mono uppercase text-[#737373]">
                                        {titleCase(variant.fuel_type)}
                                      </span>

                                      <span className="text-[9px] font-mono uppercase text-[#737373]">
                                        {variant.is_used ? 'USED' : 'NEW'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const RulesTab = ({ rules }: { rules: AnyRecord[] }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <SectionTitle
        eyebrow="Symbolic Reasoning"
        title="Forward-Chaining Production Rules"
        description="Inspect the actual IF → THEN structures loaded by the reasoning engine."
      />

      {rules.length === 0 ? (
        <EmptyState
          title="No production rules"
          description="No rules were returned by the backend."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rules.map((rule) => {
            const isOpen = expanded === rule.id;

            return (
              <div
                key={rule.id}
                className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#101010]"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : rule.id)}
                  className="w-full p-5 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-[#19130F] p-2">
                      <GitBranch className="h-4 w-4 text-[#C86B3C]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-mono font-semibold text-[#D9875D]">
                          {rule.id}
                        </span>

                        <span className="rounded-md bg-[#181818] px-2 py-1 text-[9px] font-mono text-[#737373]">
                          PRIORITY {rule.priority ?? '—'}
                        </span>
                      </div>

                      <div className="mt-2 text-sm font-medium text-[#F5F3EE]">
                        {rule.description || 'Production rule'}
                      </div>
                    </div>

                    {isOpen ? (
                      <ChevronDown className="mt-1 h-4 w-4 text-[#737373]" />
                    ) : (
                      <ChevronRight className="mt-1 h-4 w-4 text-[#737373]" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-white/[0.05] p-5">
                    <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
                      <div className="rounded-xl border border-white/[0.05] bg-[#080808] p-4">
                        <div className="mb-2 text-[9px] font-mono uppercase tracking-wider text-[#737373]">
                          IF
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap text-[10px] leading-5 text-[#A3A3A3]">
                          {JSON.stringify(rule.conditions ?? {}, null, 2)}
                        </pre>
                      </div>

                      <ArrowRight className="hidden h-4 w-4 text-[#C86B3C] md:block" />

                      <div className="rounded-xl border border-[#C86B3C]/10 bg-[#110C09] p-4">
                        <div className="mb-2 text-[9px] font-mono uppercase tracking-wider text-[#C86B3C]">
                          THEN
                        </div>
                        <pre className="overflow-x-auto whitespace-pre-wrap text-[10px] leading-5 text-[#D6A58D]">
                          {JSON.stringify(rule.conclusions ?? {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const FuzzyTab = ({ fuzzySets }: { fuzzySets: AnyRecord }) => {
  const entries = Object.entries(fuzzySets);

  return (
    <div className="space-y-5">
      <SectionTitle
        eyebrow="Fuzzy Inference"
        title="Membership Functions"
        description="Inspect the membership definitions used by the fuzzy reasoning engine."
      />

      {entries.length === 0 ? (
        <EmptyState
          title="No fuzzy sets"
          description="The backend did not return fuzzy membership definitions."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {entries.map(([variable, definition]: [string, any]) => (
            <div
              key={variable}
              className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#19130F] p-2">
                  <Activity className="h-4 w-4 text-[#C86B3C]" />
                </div>

                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#C86B3C]">
                    Variable
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-[#F5F3EE]">
                    {titleCase(variable)}
                  </h3>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {Object.entries(definition?.sets || {}).map(
                  ([setName, points]: [string, any]) => {
                    const numericPoints = Array.isArray(points)
                      ? points.filter((point) => Number.isFinite(Number(point)))
                      : [];

                    const min =
                      numericPoints.length > 0
                        ? Math.min(...numericPoints.map(Number))
                        : 0;

                    const max =
                      numericPoints.length > 0
                        ? Math.max(...numericPoints.map(Number))
                        : 100;

                    const range = max - min || 1;

                    return (
                      <div
                        key={setName}
                        className="rounded-xl border border-white/[0.05] bg-[#0B0B0B] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[#F5F3EE]">
                            {titleCase(setName)}
                          </span>

                          <span className="text-[9px] font-mono text-[#737373]">
                            {numericPoints.join(' · ')}
                          </span>
                        </div>

                        <div className="relative mt-5 h-20">
                          <div className="absolute left-0 right-0 top-10 h-px bg-white/[0.08]" />

                          {numericPoints.map((point, index) => {
                            const position =
                              ((Number(point) - min) / range) * 100;

                            return (
                              <div
                                key={`${setName}-${index}`}
                                className="absolute top-7 -translate-x-1/2"
                                style={{ left: `${position}%` }}
                              >
                                <div className="h-7 w-px bg-[#C86B3C]" />
                                <div className="mt-1 whitespace-nowrap text-[8px] font-mono text-[#737373]">
                                  {point}
                                </div>
                              </div>
                            );
                          })}

                          <div className="absolute left-0 top-11 text-[8px] font-mono text-[#525252]">
                            {min}
                          </div>

                          <div className="absolute right-0 top-11 text-[8px] font-mono text-[#525252]">
                            {max}
                          </div>
                        </div>

                        <div className="mt-2 text-[9px] leading-4 text-[#737373]">
                          Membership parameters are displayed directly from
                          the backend definition.
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BayesianTab = ({
  bayesianPriors,
}: {
  bayesianPriors: AnyRecord;
}) => {
  const entries = Object.entries(bayesianPriors);

  return (
    <div className="space-y-5">
      <SectionTitle
        eyebrow="Probabilistic Reasoning"
        title="Bayesian Network"
        description="Inspect prior distributions and the probabilistic variables exposed by the backend."
      />

      {entries.length === 0 ? (
        <EmptyState
          title="No Bayesian nodes"
          description="The backend did not return Bayesian node definitions."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {entries.map(([nodeName, nodeDef]: [string, any]) => {
            const states = Array.isArray(nodeDef?.states)
              ? nodeDef.states
              : [];

            const priors = Array.isArray(nodeDef?.prior)
              ? nodeDef.prior
              : [];

            return (
              <div
                key={nodeName}
                className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#19130F] p-2">
                    <Zap className="h-4 w-4 text-[#C86B3C]" />
                  </div>

                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-wider text-[#C86B3C]">
                      Bayesian Node
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-[#F5F3EE]">
                      {titleCase(nodeName)}
                    </h3>

                    {nodeDef?.description && (
                      <p className="mt-1 text-xs leading-5 text-[#737373]">
                        {nodeDef.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {states.map((state: string, index: number) => {
                    const prior = Number(priors[index] ?? 0);
                    const percentage = Math.max(
                      0,
                      Math.min(100, prior * 100)
                    );

                    return (
                      <div
                        key={`${nodeName}-${state}`}
                        className="rounded-xl border border-white/[0.05] bg-[#0B0B0B] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-[#F5F3EE]">
                            {titleCase(state)}
                          </span>

                          <span className="font-mono text-[10px] text-[#C86B3C]">
                            {Number.isFinite(prior)
                              ? `${percentage.toFixed(1)}%`
                              : '—'}
                          </span>
                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1C1C1C]">
                          <div
                            className="h-full rounded-full bg-[#C86B3C] transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-white/[0.05] bg-[#0B0B0B] p-3 text-center">
                    <div className="text-[8px] font-mono uppercase text-[#525252]">
                      Prior
                    </div>
                    <div className="mt-1 text-xs text-[#A3A3A3]">P(H)</div>
                  </div>

                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-3.5 w-3.5 text-[#C86B3C]" />
                  </div>

                  <div className="rounded-lg border border-white/[0.05] bg-[#0B0B0B] p-3 text-center">
                    <div className="text-[8px] font-mono uppercase text-[#525252]">
                      Evidence
                    </div>
                    <div className="mt-1 text-xs text-[#A3A3A3]">E</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const HealthTab = ({
  vehicles,
  rules,
  fuzzySets,
  bayesianPriors,
}: {
  vehicles: AnyRecord[];
  rules: AnyRecord[];
  fuzzySets: AnyRecord;
  bayesianPriors: AnyRecord;
}) => {
  const imageMissing = vehicles.filter(
    (vehicle) =>
      !vehicle.image_url &&
      !vehicle.image_path &&
      !vehicle.image
  ).length;

  const invalidPrices = vehicles.filter(
    (vehicle) =>
      !Number.isFinite(Number(vehicle.price_inr)) ||
      Number(vehicle.price_inr) <= 0
  ).length;

  const duplicateIds = vehicles.length - new Set(
    vehicles.map((vehicle) => vehicle.id)
  ).size;

  const usedCount = vehicles.filter((vehicle) => vehicle.is_used).length;
  const newCount = vehicles.length - usedCount;

  const checks = [
    {
      label: 'Vehicle records',
      value: vehicles.length,
      good: vehicles.length > 0,
    },
    {
      label: 'Production rules',
      value: rules.length,
      good: rules.length > 0,
    },
    {
      label: 'Fuzzy variables',
      value: Object.keys(fuzzySets).length,
      good: Object.keys(fuzzySets).length > 0,
    },
    {
      label: 'Bayesian nodes',
      value: Object.keys(bayesianPriors).length,
      good: Object.keys(bayesianPriors).length > 0,
    },
    {
      label: 'New vehicles',
      value: newCount,
      good: true,
    },
    {
      label: 'Used vehicles',
      value: usedCount,
      good: true,
    },
    {
      label: 'Missing image mappings',
      value: imageMissing,
      good: imageMissing === 0,
    },
    {
      label: 'Invalid prices',
      value: invalidPrices,
      good: invalidPrices === 0,
    },
    {
      label: 'Duplicate vehicle IDs',
      value: duplicateIds,
      good: duplicateIds === 0,
    },
  ];

  return (
    <div className="space-y-5">
      <SectionTitle
        eyebrow="Data Integrity"
        title="Knowledge Base Health"
        description="Basic client-side validation of the data currently returned by the backend."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((check) => (
          <div
            key={check.label}
            className="rounded-2xl border border-white/[0.06] bg-[#101010] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[9px] font-mono uppercase tracking-wider text-[#737373]">
                  {check.label}
                </div>
                <div className="mt-2 text-2xl font-semibold text-[#F5F3EE]">
                  {check.value}
                </div>
              </div>

              {check.good ? (
                <CheckCircle2 className="h-5 w-5 text-[#8FAF8A]" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-[#C86B3C]" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-[#0C0C0C] p-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-4 w-4 text-[#C86B3C]" />
          <div>
            <h3 className="text-sm font-semibold text-[#F5F3EE]">
              Validation Scope
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#737373]">
              This panel reports checks that can be verified from the data
              already returned to this page. Backend image-file integrity,
              manifest correctness and server-side rule execution should be
              validated by their respective backend services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const KnowledgeBasePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('vehicles');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [fuzzySets, setFuzzySets] = useState<AnyRecord>({});
  const [bayesianPriors, setBayesianPriors] = useState<AnyRecord>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [fuelFilter, setFuelFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [bodyFilter, setBodyFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState('all');
  const [selectedVehicle, setSelectedVehicle] =
    useState<AnyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    Promise.all([
      fetchVehicles(),
      fetchRules(),
      fetchFuzzySets(),
      fetchBayesianPriors(),
    ])
      .then(([vehicleResponse, ruleResponse, fuzzyResponse, bayesianResponse]) => {
        if (!mounted) return;

        setVehicles(vehicleResponse || []);
        setRules(ruleResponse?.rules || []);
        setFuzzySets(fuzzyResponse?.fuzzy_sets || {});
        setBayesianPriors(bayesianResponse?.nodes || {});
      })
      .catch((err) => {
        if (!mounted) return;
        console.error(err);
        setError('Unable to load the knowledge base.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const vehicleRecords = vehicles as unknown as AnyRecord[];

  const bodyTypes = useMemo(() => {
    return Array.from(
      new Set(
        vehicleRecords
          .map((vehicle) =>
            normalize(vehicle.body_type || vehicle.vehicle_segment)
          )
          .filter(Boolean)
      )
    ).sort();
  }, [vehicleRecords]);

  const filteredVehicles = useMemo(() => {
    const query = normalize(searchQuery);

    return vehicleRecords.filter((vehicle) => {
      const searchable = [
        vehicle.name,
        vehicle.brand,
        vehicle.variant,
        vehicle.model_family,
        vehicle.id,
      ]
        .map(normalize)
        .join(' ');

      const matchesSearch =
        !query || searchable.includes(query);

      const fuel = normalize(vehicle.fuel_type);
      const matchesFuel =
        fuelFilter === 'all' || fuel === normalize(fuelFilter);

      const matchesCondition =
        conditionFilter === 'all' ||
        (conditionFilter === 'used'
          ? Boolean(vehicle.is_used)
          : !vehicle.is_used);

      const body = normalize(
        vehicle.body_type || vehicle.vehicle_segment
      );

      const matchesBody =
        bodyFilter === 'all' || body === normalize(bodyFilter);

      const matchesMarket =
        marketFilter === 'all' ||
        (marketFilter === 'new' && !vehicle.is_used) ||
        (marketFilter === 'used' && Boolean(vehicle.is_used));

      return (
        matchesSearch &&
        matchesFuel &&
        matchesCondition &&
        matchesBody &&
        matchesMarket
      );
    });
  }, [
    vehicleRecords,
    searchQuery,
    fuelFilter,
    conditionFilter,
    bodyFilter,
    marketFilter,
  ]);

  const tabs: {
    id: Tab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
      {
        id: 'vehicles',
        label: 'Vehicles',
        icon: <Fuel className="h-3.5 w-3.5" />,
        count: vehicles.length,
      },
      {
        id: 'ontology',
        label: 'Ontology',
        icon: <GitBranch className="h-3.5 w-3.5" />,
      },
      {
        id: 'rules',
        label: 'Rules',
        icon: <Layers className="h-3.5 w-3.5" />,
        count: rules.length,
      },
      {
        id: 'fuzzy',
        label: 'Fuzzy',
        icon: <Activity className="h-3.5 w-3.5" />,
      },
      {
        id: 'bayesian',
        label: 'Bayesian',
        icon: <Zap className="h-3.5 w-3.5" />,
      },
      {
        id: 'health',
        label: 'Data Health',
        icon: <ShieldCheck className="h-3.5 w-3.5" />,
      },
    ];

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#050505] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="h-3 w-32 animate-pulse rounded bg-[#181818]" />
          <div className="mt-4 h-8 w-72 animate-pulse rounded bg-[#181818]" />
          <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-[#111111]" />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-2xl border border-white/[0.05] bg-[#101010]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#050505] px-5">
        <div className="max-w-md rounded-2xl border border-white/[0.07] bg-[#101010] p-7 text-center">
          <AlertTriangle className="mx-auto h-7 w-7 text-[#C86B3C]" />
          <h2 className="mt-4 text-sm font-semibold text-[#F5F3EE]">
            Knowledge Base unavailable
          </h2>
          <p className="mt-2 text-xs leading-5 text-[#737373]">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-[#C86B3C] px-4 py-2 text-xs font-semibold text-black transition hover:bg-[#D97745]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F3EE]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="border-b border-white/[0.06] pb-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.2em] text-[#C86B3C]">
                <BrainCircuit className="h-3.5 w-3.5" />
                VehicleIQ Intelligence Core
              </div>

              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Knowledge Base
              </h1>

              <p className="mt-2 max-w-2xl text-xs leading-6 text-[#737373]">
                Inspect the structured vehicle knowledge, ontology, symbolic
                rules, fuzzy membership definitions and Bayesian priors that
                power the decision-support engine.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/[0.06] bg-[#101010] px-4 py-3 text-center">
                <div className="text-lg font-semibold text-[#F5F3EE]">
                  {vehicles.length}
                </div>
                <div className="text-[8px] font-mono uppercase tracking-wider text-[#737373]">
                  Vehicles
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#101010] px-4 py-3 text-center">
                <div className="text-lg font-semibold text-[#F5F3EE]">
                  {rules.length}
                </div>
                <div className="text-[8px] font-mono uppercase tracking-wider text-[#737373]">
                  Rules
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-[#101010] px-4 py-3 text-center">
                <div className="text-lg font-semibold text-[#F5F3EE]">
                  {Object.keys(bayesianPriors).length}
                </div>
                <div className="text-[8px] font-mono uppercase tracking-wider text-[#737373]">
                  Bayes
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="sticky top-0 z-20 mt-6 overflow-x-auto border-b border-white/[0.06] bg-[#050505]/95 backdrop-blur">
          <div className="flex min-w-max gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-[10px] font-mono uppercase tracking-wider transition ${activeTab === tab.id
                    ? 'border-[#C86B3C] bg-[#101010] text-[#F5F3EE]'
                    : 'border-transparent text-[#737373] hover:bg-[#0D0D0D] hover:text-[#A3A3A3]'
                  }`}
              >
                {tab.icon}
                <span>{tab.label}</span>

                {tab.count !== undefined && (
                  <span className="rounded bg-[#181818] px-1.5 py-0.5 text-[8px] text-[#737373]">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <main className="mt-8">
          {activeTab === 'vehicles' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/[0.06] bg-[#0C0C0C] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-[#525252]" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) =>
                        setSearchQuery(event.target.value)
                      }
                      placeholder="Search brand, model, variant or vehicle ID..."
                      className="w-full rounded-xl border border-white/[0.07] bg-[#111111] py-2.5 pl-10 pr-4 text-xs text-[#F5F3EE] outline-none transition placeholder:text-[#525252] focus:border-[#C86B3C]/40"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto">
                    <Filter className="h-3.5 w-3.5 shrink-0 text-[#737373]" />

                    <select
                      value={marketFilter}
                      onChange={(event) =>
                        setMarketFilter(event.target.value)
                      }
                      className="rounded-lg border border-white/[0.07] bg-[#111111] px-3 py-2 text-[10px] font-mono uppercase text-[#A3A3A3] outline-none"
                    >
                      <option value="all">Market: All</option>
                      <option value="new">New</option>
                      <option value="used">Used</option>
                    </select>

                    <select
                      value={fuelFilter}
                      onChange={(event) =>
                        setFuelFilter(event.target.value)
                      }
                      className="rounded-lg border border-white/[0.07] bg-[#111111] px-3 py-2 text-[10px] font-mono uppercase text-[#A3A3A3] outline-none"
                    >
                      <option value="all">Fuel: All</option>
                      <option value="ev">EV</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="cng">CNG</option>
                    </select>

                    <select
                      value={bodyFilter}
                      onChange={(event) =>
                        setBodyFilter(event.target.value)
                      }
                      className="rounded-lg border border-white/[0.07] bg-[#111111] px-3 py-2 text-[10px] font-mono uppercase text-[#A3A3A3] outline-none"
                    >
                      <option value="all">Body: All</option>
                      {bodyTypes.map((body) => (
                        <option key={body} value={body}>
                          {titleCase(body)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {['all', 'new', 'used'].map((condition) => (
                    <button
                      key={condition}
                      onClick={() => setConditionFilter(condition)}
                      className={`rounded-lg border px-3 py-1.5 text-[9px] font-mono uppercase transition ${conditionFilter === condition
                          ? 'border-[#C86B3C]/30 bg-[#19130F] text-[#D9875D]'
                          : 'border-white/[0.06] bg-[#111111] text-[#737373] hover:text-[#A3A3A3]'
                        }`}
                    >
                      {condition === 'all'
                        ? 'All conditions'
                        : condition === 'used'
                          ? 'Pre-owned'
                          : 'New'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-[#F5F3EE]">
                    Vehicle records
                  </div>
                  <div className="mt-1 text-[10px] font-mono text-[#737373]">
                    Showing {filteredVehicles.length} of {vehicles.length}
                  </div>
                </div>

                <div className="hidden items-center gap-2 text-[9px] font-mono uppercase text-[#525252] sm:flex">
                  <Database className="h-3.5 w-3.5" />
                  Backend dataset
                </div>
              </div>

              {filteredVehicles.length === 0 ? (
                <EmptyState
                  title="No matching vehicles"
                  description="No vehicle in the loaded knowledge base matches the current search and filters."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredVehicles.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      onInspect={setSelectedVehicle}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ontology' && (
            <OntologyTab vehicles={vehicleRecords} />
          )}

          {activeTab === 'rules' && <RulesTab rules={rules} />}

          {activeTab === 'fuzzy' && <FuzzyTab fuzzySets={fuzzySets} />}

          {activeTab === 'bayesian' && (
            <BayesianTab bayesianPriors={bayesianPriors} />
          )}

          {activeTab === 'health' && (
            <HealthTab
              vehicles={vehicleRecords}
              rules={rules}
              fuzzySets={fuzzySets}
              bayesianPriors={bayesianPriors}
            />
          )}
        </main>
      </div>

      {selectedVehicle && (
        <VehicleInspector
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
};

export default KnowledgeBasePage;