import { useState, type CSSProperties } from 'react';
import { BottomSheet } from './BottomSheet';
import {
  VEHICLE_CLASS_ORDER, VEHICLE_CLASS_LABELS, CONDITION_LABELS, VEHICLE_MIN_AGE,
} from '@lifeverse/shared';
import type { OwnedVehicle, VehicleListing, Finance, VehicleClass } from '@lifeverse/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  garage: OwnedVehicle[];
  dealership: VehicleListing[];
  finance: Finance;
  age: number;
  isLoading: boolean;
  onBuy: (modelKey: string, year: number, condition: string, primary: boolean) => void;
  onSell: (vehicleId: string) => void;
  onSetPrimary: (vehicleId: string) => void;
  onService: (vehicleId: string) => void;
  onRepair: (vehicleId: string) => void;
  onWash: (vehicleId: string) => void;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

function Badge({ name, color }: { name: string; color: string }): JSX.Element {
  return (
    <span style={{ background: color, color: '#fff', padding: '1px 7px', borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
      {name}
    </span>
  );
}

const miniBtn: CSSProperties = {
  flex: '1 1 auto', minWidth: 0, padding: '8px 6px', fontSize: 11, fontWeight: 700,
  background: 'var(--card-hover)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8,
};

export function GarageSheet(props: Props): JSX.Element {
  const { isOpen, onClose, garage, dealership, finance, age, isLoading,
    onBuy, onSell, onSetPrimary, onService, onRepair, onWash } = props;
  const [tab, setTab] = useState<'dealership' | 'garage'>('dealership');

  const tooYoung = age < VEHICLE_MIN_AGE;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Garage">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, marginTop: 4 }}>
        {(['dealership', 'garage'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`,
              background: tab === t ? 'var(--accent-glow)' : 'var(--card)',
              color: tab === t ? 'var(--accent)' : 'var(--text-dim)',
            }}>
            {t === 'dealership' ? '🏪 Dealership' : `🚗 My Garage${garage.length ? ` (${garage.length})` : ''}`}
          </button>
        ))}
      </div>

      {tooYoung && tab === 'dealership' && (
        <p style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>
          You must be {VEHICLE_MIN_AGE} to buy a vehicle. Browse for now!
        </p>
      )}

      {tab === 'dealership' && VEHICLE_CLASS_ORDER.map((cls: VehicleClass) => {
        const items = dealership.filter((l) => l.class === cls);
        if (items.length === 0) return null;
        return (
          <div key={cls}>
            <div className="lv-cat-header"><span>🚘</span><span>{VEHICLE_CLASS_LABELS[cls]}</span></div>
            {items.map((l) => {
              const tooPoor = finance.cash < l.price;
              const disabled = isLoading || tooPoor || tooYoung;
              return (
                <div key={l.key} className={`lv-activity-row${disabled ? ' disabled' : ''}`}
                  onClick={disabled ? undefined : () => { onBuy(l.modelKey, l.year, l.condition, garage.length === 0); onClose(); }}>
                  <div className="lv-activity-info">
                    <div className="lv-activity-name">{l.emoji} {l.modelName}</div>
                    <div className="lv-activity-desc" style={{ whiteSpace: 'normal', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Badge name={l.brandName} color={l.brandColor} />
                      <span>{l.year} · {CONDITION_LABELS[l.condition]} · ~{fmt(l.monthlyMaintenance * 12)}/yr{l.appreciationRate < 0 ? ' · 📈 appreciates' : ''}</span>
                    </div>
                  </div>
                  <div className="lv-activity-cost">
                    <span className="lv-cost-pill money">{fmt(l.price)}</span>
                    <span style={{ fontSize: 10, color: tooPoor ? 'var(--danger)' : 'var(--success)' }}>{tooPoor ? 'Too pricey' : 'Buy ›'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {tab === 'garage' && (
        garage.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>
            Your garage is empty. Buy a car from the Dealership tab to get started.
          </p>
        ) : (
          <>
            <div className="lv-cat-header"><span>🔑</span><span>Owned Vehicles</span></div>
            {garage.map((v) => (
              <div key={v.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span>{v.emoji}</span><Badge name={v.brandName} color={v.brandColor} /> {v.modelName}
                  </div>
                  {v.isPrimary && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>⭐ DAILY</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 11, margin: '8px 0' }}>
                  <Stat label="Value" value={fmt(v.currentValue)} good />
                  <Stat label="Year" value={String(v.year)} />
                  <Stat label="Condition" value={CONDITION_LABELS[v.condition]} />
                  <Stat label="Upkeep" value={`${fmt(v.monthlyMaintenance * 12)}/yr`} />
                  <Stat label={v.depreciationRate < 0 ? 'Appreciates' : 'Depreciates'} value={`${v.depreciationRate < 0 ? '+' : '-'}${Math.abs(Math.round(v.depreciationRate * 100))}%/yr`} good={v.depreciationRate < 0} />
                  <Stat label="Bought" value={fmt(v.purchasePrice)} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {!v.isPrimary && <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={() => onSetPrimary(v.id)}>Daily driver</button>}
                  <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={() => onService(v.id)}>Service</button>
                  <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={() => onRepair(v.id)}>Repair</button>
                  <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={() => onWash(v.id)}>Wash</button>
                  <button className="lv-btn" style={{ ...miniBtn, color: 'var(--danger)', borderColor: 'var(--danger)' }} disabled={isLoading} onClick={() => onSell(v.id)}>Sell {fmt(v.currentValue)}</button>
                </div>
              </div>
            ))}
          </>
        )
      )}
      <div style={{ height: 12 }} />
    </BottomSheet>
  );
}

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }): JSX.Element {
  return (
    <div>
      <div style={{ color: 'var(--muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontWeight: 700, color: good ? 'var(--success)' : 'var(--text)' }}>{value}</div>
    </div>
  );
}
