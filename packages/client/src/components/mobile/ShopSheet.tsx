import { useState, type CSSProperties } from 'react';
import { BottomSheet } from './BottomSheet';
import {
  TIER_LABELS, CONDITION_LABELS as VEHICLE_CONDITION_LABELS,
  CATALOG_BY_CATEGORY, COLLECTIBLE_CATEGORY_ORDER, COLLECTIBLE_CATEGORY_LABELS,
  COLLECTIBLE_CATEGORY_EMOJI, newCollectibleListing,
} from '@lifeverse/shared';
import type {
  Finance, Listing, OwnedProperty, OwnedVehicle, VehicleListing,
  OwnedCollectible, CollectibleCategory, PropertyTier,
} from '@lifeverse/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  age: number;
  isLoading: boolean;
  finance: Finance;
  // vehicles
  dealership: VehicleListing[];
  garage: OwnedVehicle[];
  onBuyCar: (modelKey: string, year: number, condition: string, primary: boolean) => void;
  onSellVehicle: (vehicleId: string) => void;
  onSetPrimaryVehicle: (vehicleId: string) => void;
  onServiceVehicle: (vehicleId: string) => void;
  onRepairVehicle: (vehicleId: string) => void;
  onWashVehicle: (vehicleId: string) => void;
  // real estate
  listings: Listing[];
  properties: OwnedProperty[];
  onBuyHome: (key: string, moveIn?: boolean) => void;
  onSellProperty: (propertyId: string) => void;
  // collectibles
  collectibles: OwnedCollectible[];
  onBuyCollectible: (category: string, itemKey: string, year: number, condition: string) => void;
  onSellCollectible: (id: string) => void;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

const miniBtn: CSSProperties = {
  flex: '1 1 auto', minWidth: 0, padding: '8px 6px', fontSize: 11, fontWeight: 700,
  background: 'var(--card-hover)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8,
};

function Badge({ name, color }: { name: string; color: string }): JSX.Element {
  return (
    <span style={{ background: color, color: '#fff', padding: '1px 7px', borderRadius: 6, fontSize: 10, fontWeight: 800, whiteSpace: 'nowrap' }}>
      {name}
    </span>
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

const TIER_ORDER: PropertyTier[] = ['entry', 'mid', 'family', 'luxury', 'ultra'];

export function ShopSheet(props: Props): JSX.Element {
  const {
    isOpen, onClose, age, isLoading, finance,
    dealership, garage, onBuyCar, onSellVehicle, onSetPrimaryVehicle, onServiceVehicle, onRepairVehicle, onWashVehicle,
    listings, properties, onBuyHome, onSellProperty,
    collectibles, onBuyCollectible, onSellCollectible,
  } = props;
  const [tab, setTab] = useState<'shop' | 'collection'>('shop');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (k: string) => setOpen((prev) => {
    const next = new Set(prev);
    next.has(k) ? next.delete(k) : next.add(k);
    return next;
  });

  const tooYoung = age < 18;

  /** A collapsible header row (chevron + emoji + label + optional count). */
  function Header({ k, emoji, label, count, level }: { k: string; emoji: string; label: string; count?: number; level: 1 | 2 }): JSX.Element {
    const isOpen = open.has(k);
    return (
      <button onClick={() => toggle(k)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        padding: level === 1 ? '12px 12px' : '9px 12px', marginTop: level === 1 ? 8 : 4,
        background: level === 1 ? 'var(--card)' : 'var(--card-hover)',
        border: '1px solid var(--border)', borderRadius: 10,
        color: 'var(--text)', fontSize: level === 1 ? 15 : 13, fontWeight: level === 1 ? 800 : 700,
        marginLeft: level === 2 ? 8 : 0,
      }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', width: 10 }}>{isOpen ? '▾' : '▸'}</span>
        <span style={{ fontSize: level === 1 ? 18 : 15 }}>{emoji}</span>
        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
        {count !== undefined && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{count}</span>}
      </button>
    );
  }

  // Vehicles: brand-new listings grouped by brand.
  const newCars = dealership.filter((l) => l.condition === 'brand_new');
  const carsByBrand = new Map<string, VehicleListing[]>();
  for (const l of newCars) { const a = carsByBrand.get(l.brandName) ?? []; a.push(l); carsByBrand.set(l.brandName, a); }

  function renderShop(): JSX.Element {
    return (
      <>
        {tooYoung && <p style={{ fontSize: 13, color: 'var(--muted)', padding: '6px 0' }}>You must be 18 to shop. Browse for now!</p>}

        {/* 🚗 Vehicles */}
        <Header k="cat:vehicles" emoji="🚗" label="Vehicles" count={newCars.length} level={1} />
        {open.has('cat:vehicles') && [...carsByBrand.entries()].map(([brand, cars]) => (
          <div key={brand}>
            <Header k={`veh:${brand}`} emoji="🏷️" label={brand} count={cars.length} level={2} />
            {open.has(`veh:${brand}`) && cars.map((l) => {
              const tooPoor = finance.cash < l.price; const disabled = isLoading || tooPoor || tooYoung;
              return (
                <div key={l.key} className={`lv-activity-row${disabled ? ' disabled' : ''}`} style={{ marginLeft: 16 }}
                  onClick={disabled ? undefined : () => { onBuyCar(l.modelKey, l.year, l.condition, garage.length === 0); }}>
                  <div className="lv-activity-info">
                    <div className="lv-activity-name">{l.emoji} {l.modelName}</div>
                    <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>{l.year} · ~{fmt(l.monthlyMaintenance * 12)}/yr upkeep{l.appreciationRate < 0 ? ' · 📈' : ''}</div>
                  </div>
                  <div className="lv-activity-cost">
                    <span className="lv-cost-pill money">{fmt(l.price)}</span>
                    <span style={{ fontSize: 10, color: tooPoor ? 'var(--danger)' : 'var(--success)' }}>{tooPoor ? 'Too pricey' : 'Buy ›'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* 🏠 Real Estate */}
        <Header k="cat:realestate" emoji="🏠" label="Real Estate" level={1} />
        {open.has('cat:realestate') && TIER_ORDER.map((tier) => {
          const items = listings.filter((l) => l.tier === tier && l.buyable);
          if (items.length === 0) return null;
          return (
            <div key={tier}>
              <Header k={`re:${tier}`} emoji="🏘️" label={TIER_LABELS[tier]} count={items.length} level={2} />
              {open.has(`re:${tier}`) && items.map((l) => {
                const down = Math.round(l.price * 0.2); const tooPoor = finance.cash < down; const disabled = isLoading || tooPoor || tooYoung;
                return (
                  <div key={l.key} className={`lv-activity-row${disabled ? ' disabled' : ''}`} style={{ marginLeft: 16 }}
                    onClick={disabled ? undefined : () => { onBuyHome(l.key, true); }}>
                    <div className="lv-activity-info">
                      <div className="lv-activity-name">{l.label}</div>
                      <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>{l.bedrooms}bd/{l.bathrooms}ba · +{Math.round(l.appreciation * 100)}%/yr</div>
                    </div>
                    <div className="lv-activity-cost">
                      <span className="lv-cost-pill money">{fmt(l.price)}</span>
                      <span style={{ fontSize: 10, color: tooPoor ? 'var(--danger)' : 'var(--success)' }}>{tooPoor ? `Need ${fmt(down)} down` : 'Buy ›'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Collectible categories */}
        {COLLECTIBLE_CATEGORY_ORDER.map((cat: CollectibleCategory) => {
          const items = CATALOG_BY_CATEGORY[cat];
          const byBrand = new Map<string, typeof items>();
          for (const it of items) { const a = byBrand.get(it.brand) ?? []; a.push(it); byBrand.set(it.brand, a); }
          return (
            <div key={cat}>
              <Header k={`cat:${cat}`} emoji={COLLECTIBLE_CATEGORY_EMOJI[cat]} label={COLLECTIBLE_CATEGORY_LABELS[cat]} count={items.length} level={1} />
              {open.has(`cat:${cat}`) && [...byBrand.entries()].map(([brand, group]) => (
                <div key={brand}>
                  <Header k={`col:${cat}:${brand}`} emoji="🏷️" label={brand} count={group.length} level={2} />
                  {open.has(`col:${cat}:${brand}`) && group.map((it) => {
                    const l = newCollectibleListing(it);
                    const tooPoor = finance.cash < l.price; const disabled = isLoading || tooPoor || tooYoung;
                    return (
                      <div key={it.key} className={`lv-activity-row${disabled ? ' disabled' : ''}`} style={{ marginLeft: 16 }}
                        onClick={disabled ? undefined : () => { onBuyCollectible(cat, it.key, l.year, l.condition); }}>
                        <div className="lv-activity-info">
                          <div className="lv-activity-name">{l.emoji} {l.name}</div>
                          <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>
                            {l.appreciationRate > 0 ? `📈 appreciates +${Math.round(l.appreciationRate * 100)}%/yr` : l.monthlyMaintenance > 0 ? `~${fmt(l.monthlyMaintenance * 12)}/yr upkeep` : 'Holds value'}
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
              ))}
            </div>
          );
        })}
        <div style={{ height: 12 }} />
      </>
    );
  }

  function renderCollection(): JSX.Element {
    const colByCat = new Map<CollectibleCategory, OwnedCollectible[]>();
    for (const c of collectibles) { const a = colByCat.get(c.category) ?? []; a.push(c); colByCat.set(c.category, a); }
    const empty = properties.length === 0 && garage.length === 0 && collectibles.length === 0;
    if (empty) return <p style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>You don't own anything yet. Browse the Shop tab to start your collection.</p>;

    return (
      <>
        {properties.length > 0 && (
          <>
            <div className="lv-cat-header"><span>🏠</span><span>Real Estate ({properties.length})</span></div>
            {properties.map((p) => (
              <div key={p.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{p.label}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: p.isResidence ? 'var(--accent)' : p.isRentedOut ? 'var(--success)' : 'var(--muted)', textTransform: 'uppercase' }}>
                    {p.isResidence ? 'Residence' : p.isRentedOut ? 'Rented' : 'Idle'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, margin: '8px 0' }}>
                  <Stat label="Value" value={fmt(p.currentValue)} good />
                  <Stat label="Bought" value={fmt(p.purchasePrice)} />
                </div>
                <button className="lv-btn" style={{ ...miniBtn, color: 'var(--danger)', borderColor: 'var(--danger)' }} disabled={isLoading} onClick={() => onSellProperty(p.id)}>Sell {fmt(p.currentValue)}</button>
              </div>
            ))}
          </>
        )}

        {garage.length > 0 && (
          <>
            <div className="lv-cat-header"><span>🚗</span><span>Vehicles ({garage.length})</span></div>
            {garage.map((v) => (
              <div key={v.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span>{v.emoji}</span><Badge name={v.brandName} color={v.brandColor} /> {v.modelName}
                  </div>
                  {v.isPrimary && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>⭐ DAILY</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 11, margin: '8px 0' }}>
                  <Stat label="Value" value={fmt(v.currentValue)} good />
                  <Stat label="Year" value={String(v.year)} />
                  <Stat label="Condition" value={VEHICLE_CONDITION_LABELS[v.condition]} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {!v.isPrimary && <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={() => onSetPrimaryVehicle(v.id)}>Daily</button>}
                  <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={() => onServiceVehicle(v.id)}>Service</button>
                  <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={() => onRepairVehicle(v.id)}>Repair</button>
                  <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={() => onWashVehicle(v.id)}>Wash</button>
                  <button className="lv-btn" style={{ ...miniBtn, color: 'var(--danger)', borderColor: 'var(--danger)' }} disabled={isLoading} onClick={() => onSellVehicle(v.id)}>Sell {fmt(v.currentValue)}</button>
                </div>
              </div>
            ))}
          </>
        )}

        {COLLECTIBLE_CATEGORY_ORDER.map((cat) => {
          const items = colByCat.get(cat);
          if (!items || items.length === 0) return null;
          return (
            <div key={cat}>
              <div className="lv-cat-header"><span>{COLLECTIBLE_CATEGORY_EMOJI[cat]}</span><span>{COLLECTIBLE_CATEGORY_LABELS[cat]} ({items.length})</span></div>
              {items.map((i) => (
                <div key={i.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{i.emoji} {i.brand ? `${i.brand} ` : ''}{i.label}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 11, margin: '8px 0' }}>
                    <Stat label="Value" value={fmt(i.currentValue)} good />
                    <Stat label="Bought" value={fmt(i.purchasePrice)} />
                    <Stat label={i.appreciationRate >= 0 ? 'Appreciates' : 'Depreciates'} value={`${i.appreciationRate >= 0 ? '+' : ''}${Math.round(i.appreciationRate * 100)}%/yr`} good={i.appreciationRate >= 0} />
                  </div>
                  <button className="lv-btn" style={{ ...miniBtn, color: 'var(--danger)', borderColor: 'var(--danger)' }} disabled={isLoading} onClick={() => onSellCollectible(i.id)}>Sell {fmt(i.currentValue)}</button>
                </div>
              ))}
            </div>
          );
        })}
        <div style={{ height: 12 }} />
      </>
    );
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Shopping">
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, marginTop: 4 }}>
        {(['shop', 'collection'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`,
            background: tab === t ? 'var(--accent-glow)' : 'var(--card)',
            color: tab === t ? 'var(--accent)' : 'var(--text-dim)',
          }}>
            {t === 'shop' ? '🛍️ Shop' : `🎒 Collection${collectibles.length + garage.length + properties.length ? ` (${collectibles.length + garage.length + properties.length})` : ''}`}
          </button>
        ))}
      </div>
      {tab === 'shop' ? renderShop() : renderCollection()}
    </BottomSheet>
  );
}
