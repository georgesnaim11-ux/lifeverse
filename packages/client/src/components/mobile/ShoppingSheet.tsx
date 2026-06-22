import { BottomSheet } from './BottomSheet';
import { PROPERTIES, VEHICLES, SHOP_MIN_AGE } from '@lifeverse/shared';
import type { CharacterState, Finance, OwnedAsset } from '@lifeverse/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  charState: CharacterState;
  finance: Finance;
  ownedAssets: OwnedAsset[];
  isLoading: boolean;
  onBuyProperty: (type: string) => void;
  onBuyVehicle: (type: string) => void;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

const PROPERTY_ICONS: Record<string, string> = {
  apartment: '🏢', small_house: '🏠', family_house: '🏡', luxury_house: '🏘️', mansion: '🏰',
};
const VEHICLE_ICONS: Record<string, string> = {
  used_car: '🚙', sedan: '🚗', suv: '🚐', sports_car: '🏎️', luxury_car: '🚘',
};

export function ShoppingSheet({
  isOpen, onClose, charState, finance, ownedAssets, isLoading,
  onBuyProperty, onBuyVehicle,
}: Props): JSX.Element {
  const age = charState.character.age;
  const ownedTypes = new Set(ownedAssets.map((a) => a.assetType));

  if (age < SHOP_MIN_AGE) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title="Shopping">
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            You must be 18 or older to access shopping.
          </div>
          <div style={{ fontSize: 13 }}>Come back when you're {SHOP_MIN_AGE}. You're {age}.</div>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Shopping">
      <div style={{ fontSize: 13, color: 'var(--muted)', padding: '6px 2px 2px' }}>
        Cash on hand: <strong style={{ color: 'var(--success)' }}>{fmt(finance.cash)}</strong>
      </div>

      <div className="lv-cat-header"><span>🏠</span><span>Real Estate</span></div>
      {PROPERTIES.map((p) => {
        const owned = ownedTypes.has(p.type);
        const tooPoor = finance.cash < p.price;
        const disabled = owned || tooPoor || isLoading;
        return (
          <div key={p.type} className={`lv-activity-row${disabled ? ' disabled' : ''}`}
            onClick={disabled ? undefined : () => onBuyProperty(p.type)}>
            <span className="lv-activity-icon">{PROPERTY_ICONS[p.type]}</span>
            <div className="lv-activity-info">
              <div className="lv-activity-name">{p.label}</div>
              <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>
                {p.description} · +{p.happiness} happiness · {fmt(p.annualExpense)}/yr upkeep
              </div>
            </div>
            <div className="lv-activity-cost">
              <span className="lv-cost-pill money">{fmt(p.price)}</span>
              {owned ? <span style={{ fontSize: 10, color: 'var(--success)' }}>Owned ✓</span>
                : tooPoor ? <span style={{ fontSize: 10, color: 'var(--danger)' }}>Too pricey</span>
                : <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>Buy ›</span>}
            </div>
          </div>
        );
      })}

      <div className="lv-cat-header"><span>🚗</span><span>Vehicles</span></div>
      {VEHICLES.map((v) => {
        const owned = ownedTypes.has(v.type);
        const tooPoor = finance.cash < v.price;
        const disabled = owned || tooPoor || isLoading;
        return (
          <div key={v.type} className={`lv-activity-row${disabled ? ' disabled' : ''}`}
            onClick={disabled ? undefined : () => onBuyVehicle(v.type)}>
            <span className="lv-activity-icon">{VEHICLE_ICONS[v.type]}</span>
            <div className="lv-activity-info">
              <div className="lv-activity-name">{v.label}</div>
              <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>
                {v.description} · +{v.happiness} happiness · {fmt(v.annualExpense)}/yr
              </div>
            </div>
            <div className="lv-activity-cost">
              <span className="lv-cost-pill money">{fmt(v.price)}</span>
              {owned ? <span style={{ fontSize: 10, color: 'var(--success)' }}>Owned ✓</span>
                : tooPoor ? <span style={{ fontSize: 10, color: 'var(--danger)' }}>Too pricey</span>
                : <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>Buy ›</span>}
            </div>
          </div>
        );
      })}

      {ownedAssets.length > 0 && (
        <>
          <div className="lv-cat-header"><span>📦</span><span>Your Possessions</span></div>
          {ownedAssets.map((a) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 2px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</span>
              <span style={{ fontSize: 12, color: 'var(--success)' }}>{fmt(a.value)}</span>
            </div>
          ))}
        </>
      )}
    </BottomSheet>
  );
}
