import { useState, type CSSProperties } from 'react';
import { BottomSheet } from './BottomSheet';
import { TIER_LABELS, annualRentIncome } from '@lifeverse/shared';
import type { HousingState, Listing, Finance, OwnedAsset, OwnedProperty, PropertyTier } from '@lifeverse/shared';
import { VEHICLES } from '@lifeverse/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  housing: HousingState;
  listings: Listing[];
  properties: OwnedProperty[];
  finance: Finance;
  ownedAssets: OwnedAsset[];
  age: number;
  hasLivingParents: boolean;
  isLoading: boolean;
  onRent: (key: string) => void;
  onBuy: (key: string, moveIn?: boolean) => void;
  onSellProperty: (propertyId: string) => void;
  onSetResidence: (propertyId: string) => void;
  onToggleRentOut: (propertyId: string) => void;
  onMoveInParents: () => void;
  onBuyVehicle: (type: string) => void;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

const TENURE_LABEL: Record<string, string> = {
  homeless: 'Homeless', parents: 'Living with Parents', renting: 'Renting', owned: 'Homeowner',
};

const TIER_ORDER: PropertyTier[] = ['entry', 'mid', 'family', 'luxury', 'ultra'];

type Tab = 'buy' | 'rent' | 'portfolio' | 'vehicles';

export function HousingSheet(props: Props): JSX.Element {
  const { isOpen, onClose, housing, listings, properties, finance, ownedAssets, age, hasLivingParents,
    isLoading, onRent, onBuy, onSellProperty, onSetResidence, onToggleRentOut, onMoveInParents, onBuyVehicle } = props;
  const [tab, setTab] = useState<Tab>('buy');
  const [buyMode, setBuyMode] = useState<'moveIn' | 'invest'>('moveIn');

  const minor = age < 18;
  const ownedVehicles = new Set(ownedAssets.map((a) => a.assetType));
  const portfolioCount = properties.length;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Real Estate">
      {/* Current residence dashboard */}
      <div style={{
        background: housing.tenure === 'homeless' ? 'rgba(220,63,72,0.1)' : 'var(--card)',
        border: `1px solid ${housing.tenure === 'homeless' ? 'var(--danger)' : 'var(--accent-dim)'}`,
        borderRadius: 14, padding: 16, marginTop: 4, marginBottom: 14,
      }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Current Residence</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2, color: housing.tenure === 'homeless' ? 'var(--danger)' : 'var(--text)' }}>
          {housing.propertyLabel ?? TENURE_LABEL[housing.tenure]}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: housing.tenure === 'owned' || housing.tenure === 'renting' ? 10 : 0 }}>
          {TENURE_LABEL[housing.tenure]}{housing.company ? ` · ${housing.company}` : ''}
        </div>

        {(housing.tenure === 'owned' || housing.tenure === 'renting') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
            {housing.tenure === 'owned' && <Stat label="Value" value={fmt(housing.currentValue)} good />}
            {housing.tenure === 'owned' && <Stat label="Bought For" value={fmt(housing.purchasePrice)} />}
            {housing.tenure === 'owned' && <Stat label="Appreciation" value={`+${Math.round(housing.appreciationRate * 100)}%/yr`} good />}
            <Stat label={housing.tenure === 'owned' ? 'Upkeep' : 'Rent'} value={`${fmt(housing.monthlyExpense)}/mo`} />
            {housing.condition && <Stat label="Condition" value={housing.condition} />}
            {housing.bedrooms > 0 && <Stat label="Layout" value={`${housing.bedrooms}bd · ${housing.bathrooms}ba`} />}
          </div>
        )}

        {housing.tenure === 'owned' && housing.residencePropertyId && (
          <button className="lv-btn" style={{ marginTop: 12, background: 'var(--card-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
            disabled={isLoading} onClick={() => onSellProperty(housing.residencePropertyId!)}>Sell Home for {fmt(housing.currentValue)}</button>
        )}
        {(housing.tenure === 'renting' || housing.tenure === 'homeless') && hasLivingParents && (
          <button className="lv-btn" style={{ marginTop: 12, background: 'var(--card-hover)', border: '1px solid var(--border)', color: 'var(--text)' }}
            disabled={isLoading} onClick={onMoveInParents}>Move Back with Parents</button>
        )}
      </div>

      {housing.tenure === 'homeless' && (
        <div style={{ padding: '10px 14px', background: 'rgba(220,63,72,0.12)', border: '1px solid var(--danger)', borderRadius: 12, fontSize: 13, color: 'var(--danger)', fontWeight: 600, marginBottom: 12 }}>
          ⚠ You are currently homeless. Rent or buy a place to recover.
        </div>
      )}

      {minor ? (
        <p style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>
          You're under 18 — your housing is managed by your parents. You can rent or buy once you turn 18.
        </p>
      ) : (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(['buy', 'rent', 'portfolio', 'vehicles'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`,
                  background: tab === t ? 'var(--accent-glow)' : 'var(--card)',
                  color: tab === t ? 'var(--accent)' : 'var(--text-dim)',
                }}>
                {t === 'buy' ? '🏠 Buy' : t === 'rent' ? '🔑 Rent' : t === 'portfolio' ? `📊 Portfolio${portfolioCount ? ` (${portfolioCount})` : ''}` : '🚗'}
              </button>
            ))}
          </div>

          {/* Buy-mode toggle: live in it vs. hold as a rental investment */}
          {tab === 'buy' && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {([['moveIn', '🏠 Move in'], ['invest', '📈 Investment']] as const).map(([m, label]) => (
                <button key={m} onClick={() => setBuyMode(m)}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${buyMode === m ? 'var(--success)' : 'var(--border)'}`,
                    background: buyMode === m ? 'rgba(63,185,80,0.12)' : 'var(--card)',
                    color: buyMode === m ? 'var(--success)' : 'var(--text-dim)',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {tab === 'buy' && (
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 10px' }}>
              {buyMode === 'moveIn'
                ? 'Buy a home to live in — grants happiness, becomes your residence.'
                : 'Buy to rent out — earns annual income and appreciates while you hold it.'}
            </p>
          )}

          {(tab === 'buy' || tab === 'rent') && TIER_ORDER.map((tier) => {
            const items = listings.filter((l) => l.tier === tier && (tab === 'buy' ? l.buyable : l.rentable));
            if (items.length === 0) return null;
            return (
              <div key={tier}>
                <div className="lv-cat-header"><span>🏘️</span><span>{TIER_LABELS[tier]}</span></div>
                {items.map((l) => {
                  const cost = tab === 'buy' ? Math.round(l.price * 0.2) : l.monthlyRent;
                  const tooPoor = finance.cash < cost;
                  const disabled = isLoading || tooPoor;
                  return (
                    <div key={l.key} className={`lv-activity-row${disabled ? ' disabled' : ''}`}
                      onClick={disabled ? undefined : () => { tab === 'buy' ? onBuy(l.key, buyMode === 'moveIn') : onRent(l.key); onClose(); }}>
                      <div className="lv-activity-info">
                        <div className="lv-activity-name">{l.label}</div>
                        <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>
                          {l.company} · {l.condition} · {l.bedrooms}bd/{l.bathrooms}ba
                          {tab === 'buy' ? ` · +${Math.round(l.appreciation * 100)}%/yr` : ''}
                          {tab === 'buy' && buyMode === 'invest' ? ` · ~${fmt(annualRentIncome(l.monthlyRent))}/yr rent` : ''}
                        </div>
                      </div>
                      <div className="lv-activity-cost">
                        <span className="lv-cost-pill money">{tab === 'buy' ? fmt(l.price) : `${fmt(l.monthlyRent)}/mo`}</span>
                        {tab === 'buy'
                          ? <span style={{ fontSize: 10, color: tooPoor ? 'var(--danger)' : 'var(--success)' }}>{tooPoor ? 'Need ' + fmt(cost) + ' down' : buyMode === 'moveIn' ? 'Move in ›' : 'Invest ›'}</span>
                          : <span style={{ fontSize: 10, color: tooPoor ? 'var(--danger)' : 'var(--success)' }}>{tooPoor ? 'Too pricey' : 'Rent ›'}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {tab === 'portfolio' && (
            portfolioCount === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>
                You don't own any property yet. Buy a home to live in, or an investment to rent out, from the Buy tab.
              </p>
            ) : (
              <>
                <div className="lv-cat-header"><span>📊</span><span>Owned Properties</span></div>
                {properties.map((p) => {
                  const status = p.isResidence ? 'Residence' : p.isRentedOut ? 'Rented out' : 'Idle';
                  const statusColor = p.isResidence ? 'var(--accent)' : p.isRentedOut ? 'var(--success)' : 'var(--muted)';
                  return (
                    <div key={p.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{p.label}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{status}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 11, margin: '8px 0' }}>
                        <Stat label="Value" value={fmt(p.currentValue)} good />
                        <Stat label="Bought" value={fmt(p.purchasePrice)} />
                        <Stat label="Growth" value={`+${Math.round(p.appreciationRate * 100)}%/yr`} good />
                        <Stat label="Upkeep" value={`${fmt(p.monthlyUpkeep)}/mo`} />
                        {p.isRentedOut
                          ? <Stat label="Rent income" value={`${fmt(annualRentIncome(p.monthlyRent))}/yr`} good />
                          : <Stat label="Rent" value={`${fmt(p.monthlyRent)}/mo`} />}
                        {p.condition && <Stat label="Condition" value={p.condition} />}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {!p.isResidence && (
                          <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={() => onSetResidence(p.id)}>Move in</button>
                        )}
                        {!p.isResidence && (
                          <button className="lv-btn" style={miniBtn} disabled={isLoading} onClick={() => onToggleRentOut(p.id)}>
                            {p.isRentedOut ? 'Stop renting' : 'Rent out'}
                          </button>
                        )}
                        <button className="lv-btn" style={{ ...miniBtn, color: 'var(--danger)', borderColor: 'var(--danger)' }} disabled={isLoading} onClick={() => onSellProperty(p.id)}>
                          Sell {fmt(p.currentValue)}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )
          )}

          {tab === 'vehicles' && (
            <>
              <div className="lv-cat-header"><span>🚗</span><span>Vehicles</span></div>
              {VEHICLES.map((v) => {
                const owned = ownedVehicles.has(v.type);
                const tooPoor = finance.cash < v.price;
                const disabled = owned || tooPoor || isLoading;
                return (
                  <div key={v.type} className={`lv-activity-row${disabled ? ' disabled' : ''}`}
                    onClick={disabled ? undefined : () => onBuyVehicle(v.type)}>
                    <div className="lv-activity-info">
                      <div className="lv-activity-name">{v.label}</div>
                      <div className="lv-activity-desc" style={{ whiteSpace: 'normal' }}>{v.description} · +{v.happiness} happiness</div>
                    </div>
                    <div className="lv-activity-cost">
                      <span className="lv-cost-pill money">{fmt(v.price)}</span>
                      {owned ? <span style={{ fontSize: 10, color: 'var(--success)' }}>Owned ✓</span>
                        : tooPoor ? <span style={{ fontSize: 10, color: 'var(--danger)' }}>Too pricey</span>
                        : <span style={{ fontSize: 10, color: 'var(--success)' }}>Buy ›</span>}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
      <div style={{ height: 12 }} />
    </BottomSheet>
  );
}

const miniBtn: CSSProperties = {
  flex: '1 1 auto', minWidth: 0, padding: '8px 6px', fontSize: 11, fontWeight: 700,
  background: 'var(--card-hover)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8,
};

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }): JSX.Element {
  return (
    <div>
      <div style={{ color: 'var(--muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontWeight: 700, color: good ? 'var(--success)' : 'var(--text)' }}>{value}</div>
    </div>
  );
}
