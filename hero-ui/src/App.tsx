import { useState, useEffect, useCallback, CSSProperties } from 'react'
import './App.css'
import { useCurrentAccount, useSignAndExecuteTransaction, ConnectButton, useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import LightPillar from './LightPillar'

// ============= CONSTANTS =============
const PACKAGE_ID = "0x502257663195f5d5c0ff3f3ea8936727ea5c8914e265e0008e26659cac7cbe08"
const MODULE_NAME = "game"
const MAX_HP = 100
const MIN_HP_FOR_BATTLE = 20
const REFETCH_DELAY = 500
const REFETCH_INTERVAL = 2000

// ============= TYPES =============
interface Hero {
  id: string
  name: string
  hp: number
  xp: number
  level: number
}

type NotificationType = 'success' | 'error' | 'info' | 'battle'

interface Notification {
  id: string
  message: string
  type: NotificationType
}

// ============= STYLES =============
const styles = {
  container: {
    minHeight: '100vh',
    background: '#000',
    fontFamily: 'Arial, sans-serif',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  } as CSSProperties,

  background: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    opacity: 0.6
  } as CSSProperties,

  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh'
  } as CSSProperties,

  center: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  } as CSSProperties,

  healthBar: {
    position: 'relative',
    width: '100%',
    height: '8px',
    background: '#1e293b',
    borderRadius: '4px',
    overflow: 'hidden',
    border: '1px solid #334155'
  } as CSSProperties,

  characterBox: {
    width: '140px',
    height: '180px',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    border: '2px solid #334155',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    position: 'relative',
    overflow: 'hidden'
  } as CSSProperties,

  levelBadge: {
    position: 'absolute',
    top: '-8px',
    background: '#334155',
    color: '#e2e8f0',
    fontWeight: '600',
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '12px',
    border: '1px solid #475569',
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
  } as CSSProperties,

  actionButton: (disabled: boolean) => ({
    padding: '14px 40px',
    background: disabled ? '#1e293b' : '#334155',
    border: '1px solid #475569',
    borderRadius: '6px',
    color: disabled ? '#64748b' : '#e2e8f0',
    fontWeight: '600',
    fontSize: '14px',
    letterSpacing: '1px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
  }) as CSSProperties
}

const NOTIFICATION_COLORS: Record<NotificationType, { border: string; bg: string }> = {
  success: { border: '#4ade80', bg: '#16a34a' },
  error: { border: '#f87171', bg: '#dc2626' },
  battle: { border: '#fbbf24', bg: '#a855f7' },
  info: { border: '#60a5fa', bg: '#2563eb' }
}

// ============= HELPER FUNCTIONS =============
const getHpColor = (hp: number, isEnemy = false) => {
  if (hp > 60) return isEnemy ? '#06b6d4' : '#10b981'
  if (hp > 30) return '#f59e0b'
  return '#ef4444'
}

const parseHeroData = (fields: any, id: string): Hero => ({
  id,
  name: fields.name || 'Unknown',
  hp: fields.hp ?? MAX_HP,
  xp: fields.xp ?? 0,
  level: fields.level ?? 1
})

// ============= CSS ANIMATIONS =============
const cssAnimations = `
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  @keyframes shake {
    0%, 100% { transform: translateX(0) rotate(0deg); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px) rotate(-2deg); }
    20%, 40%, 60%, 80% { transform: translateX(10px) rotate(2deg); }
  }
`

// ============= COMPONENTS =============
const NotificationList = ({ notifications }: { notifications: Notification[] }) => (
  <div style={{ position: 'fixed', top: '80px', right: '16px', zIndex: 50 }}>
    {notifications.map(({ id, type, message }) => (
      <div key={id} style={{
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '14px',
        marginBottom: '8px',
        borderLeft: `4px solid ${NOTIFICATION_COLORS[type].border}`,
        background: NOTIFICATION_COLORS[type].bg,
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
      }}>
        {message}
      </div>
    ))}
  </div>
)

const HealthBar = ({ name, hp, level, xp, isEnemy = false }: {
  name: string; hp: number; level: number; xp?: number; isEnemy?: boolean
}) => (
  <div style={{ flex: 1, maxWidth: '400px', textAlign: isEnemy ? 'right' : 'left' }}>
    <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: '#94a3b8', letterSpacing: '0.5px' }}>
      {name.toUpperCase()}
    </div>
    <div style={styles.healthBar}>
      <div style={{
        height: '100%',
        width: `${hp}%`,
        background: getHpColor(hp, isEnemy),
        transition: 'width 0.4s ease'
      }} />
    </div>
    <div style={{ fontSize: '10px', fontWeight: '500', marginTop: '4px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
      {isEnemy ? (
        <><span>LVL {level}</span><span>HP: {hp}/{MAX_HP}</span></>
      ) : (
        <><span>HP: {hp}/{MAX_HP}</span><span>LVL {level} | XP: {xp}/{MAX_HP}</span></>
      )}
    </div>
  </div>
)

const Character = ({ icon, level, isShaking, badgePosition }: {
  icon: string; level: number; isShaking: boolean; badgePosition: 'left' | 'right'
}) => (
  <div style={{ position: 'relative', zIndex: 10, animation: isShaking ? 'shake 0.5s ease-in-out' : 'none' }}>
    <div style={styles.characterBox}>
      <div style={{ fontSize: '80px', color: '#64748b', fontWeight: 'bold' }}>{icon}</div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(100,116,139,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
    </div>
    <div style={{
      position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)',
      width: '100px', height: '20px', background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)',
      borderRadius: '50%', filter: 'blur(8px)'
    }} />
    <div style={{ ...styles.levelBadge, [badgePosition]: '-8px' }}>LV {level}</div>
  </div>
)

const ActionButton = ({ onClick, disabled, loading, label, loadingLabel }: {
  onClick: () => void; disabled: boolean; loading: boolean; label: string; loadingLabel: string
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={styles.actionButton(disabled)}
    onMouseEnter={(e) => !disabled && Object.assign(e.currentTarget.style, { background: '#475569', borderColor: '#64748b' })}
    onMouseLeave={(e) => !disabled && Object.assign(e.currentTarget.style, { background: '#334155', borderColor: '#475569' })}
  >
    {loading ? loadingLabel : label}
  </button>
)

// ============= MAIN COMPONENT =============
function App() {
  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()

  const [hero, setHero] = useState<Hero | null>(null)
  const [heroName, setHeroName] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingHero, setCheckingHero] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [enemyHp, setEnemyHp] = useState(MAX_HP)
  const [isShaking, setIsShaking] = useState(false)

  const { data: heroObjectData, refetch: refetchHeroData } = useSuiClientQuery(
    'getObject',
    hero?.id ? { id: hero.id, options: { showContent: true } } : null,
    { enabled: !!hero?.id, refetchInterval: REFETCH_INTERVAL }
  )

  const addNotification = useCallback((message: string, type: NotificationType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(7)
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), duration)
  }, [])

  const executeTransaction = useCallback((
    target: string,
    args: any[],
    onSuccess: (result: any) => void,
    errorMessage: string
  ) => {
    const tx = new Transaction()
    tx.moveCall({ target: `${PACKAGE_ID}::${MODULE_NAME}::${target}`, arguments: args })
    
    signAndExecute({ transaction: tx }, {
      onSuccess: (result) => {
        setTimeout(() => refetchHeroData(), REFETCH_DELAY)
        onSuccess(result)
      },
      onError: (error: any) => {
        console.error('Error:', error)
        addNotification(`❌ ${errorMessage}: ${error.message}`, 'error', 4000)
        setLoading(false)
        setIsShaking(false)
      }
    })
  }, [signAndExecute, refetchHeroData, addNotification])

  // Sync hero data from blockchain
  useEffect(() => {
    if (heroObjectData?.data?.content?.dataType === 'moveObject' && hero) {
      const fields = heroObjectData.data.content.fields as any
      const updated = parseHeroData(fields, hero.id)
      if (updated.hp !== hero.hp || updated.xp !== hero.xp || updated.level !== hero.level) {
        setHero(updated)
      }
    }
  }, [heroObjectData, hero])

  // Check for existing heroes on account change
  useEffect(() => {
    if (!account) { setHero(null); return }

    const checkHeroes = async () => {
      setCheckingHero(true)
      try {
        const { data } = await suiClient.getOwnedObjects({
          owner: account.address,
          filter: { StructType: `${PACKAGE_ID}::${MODULE_NAME}::Hero` },
          options: { showContent: true }
        })

        if (data?.[0]?.data?.content?.dataType === 'moveObject') {
          const fields = data[0].data.content.fields as any
          setHero(parseHeroData(fields, data[0].data.objectId))
        } else {
          setHero(null)
        }
      } catch (error) {
        console.error('Error checking heroes:', error)
        setHero(null)
      } finally {
        setCheckingHero(false)
      }
    }
    checkHeroes()
  }, [account, suiClient])

  const handleCreateHero = useCallback(() => {
    if (!heroName.trim() || !account) {
      addNotification('Lütfen kahraman adı girin ve cüzdanı bağlayın!', 'error')
      return
    }

    setLoading(true)
    const tx = new Transaction()
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::create_hero`,
      arguments: [tx.pure.vector("u8", Array.from(heroName).map(c => c.charCodeAt(0)))]
    })

    signAndExecute({ transaction: tx }, {
      onSuccess: () => {
        setHeroName('')
        setLoading(false)
        addNotification(`⭐ ${heroName} başarıyla oluşturuldu!`, 'success', 2000)
        setTimeout(() => window.location.reload(), 1500)
      },
      onError: (error: any) => {
        addNotification(`❌ Kahraman oluşturulamadı: ${error.message}`, 'error', 4000)
        setLoading(false)
      }
    })
  }, [heroName, account, signAndExecute, addNotification])

  const handleBattle = useCallback(() => {
    if (!hero || !account || loading) return
    if (hero.hp < MIN_HP_FOR_BATTLE) {
      addNotification('❌ HP çok düşük! Önce iyileş!', 'error')
      return
    }

    setLoading(true)
    setIsShaking(true)
    const damage = Math.floor(Math.random() * 21) + 10
    setEnemyHp(prev => Math.max(0, prev - damage))

    executeTransaction('battle', [new Transaction().object(hero.id)], () => {
      setTimeout(() => setIsShaking(false), 600)
      setLoading(false)
      addNotification(`⚔️ Savaş Kazanıldı! 💥 Düşmana ${damage} hasar! ⭐ XP +20 | ❤️ HP -20`, 'battle', 2500)
    }, 'Savaş başarısız')
  }, [hero, account, loading, executeTransaction, addNotification])

  const handleHeal = useCallback(() => {
    if (!hero || !account || loading) return
    setLoading(true)

    executeTransaction('heal', [new Transaction().object(hero.id)], () => {
      setLoading(false)
      addNotification(`💚 İyileşildi! HP 100'e döndürüldü!`, 'success', 2000)
    }, 'İyileşme başarısız')
  }, [hero, account, loading, executeTransaction, addNotification])

  const enemyLevel = hero ? Math.floor(hero.level / 2) + 1 : 1
  const canBattle = hero && hero.hp >= MIN_HP_FOR_BATTLE && !loading

  // ============= RENDER =============
  return (
    <div style={styles.container}>
      <style dangerouslySetInnerHTML={{ __html: cssAnimations }} />
      
      {/* Background */}
      <div style={styles.background}>
        <LightPillar topColor="#1e293b" bottomColor="#475569" intensity={0.6} rotationSpeed={0.15}
          glowAmount={0.004} pillarWidth={5.0} pillarHeight={0.6} noiseIntensity={0.2}
          pillarRotation={0} interactive={false} mixBlendMode="overlay" />
      </div>

      <div style={styles.content}>
        <NotificationList notifications={notifications} />

        {!account ? (
          <div style={styles.center}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                fontSize: '72px', fontWeight: '900', marginBottom: '32px',
                background: 'linear-gradient(45deg, #dc2626, #f59e0b)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>MORTAL BATTLE</h1>
              <ConnectButton />
            </div>
          </div>
        ) : checkingHero ? (
          <div style={styles.center}>
            <div style={{ fontSize: '48px', fontWeight: '900', color: '#fbbf24', animation: 'pulse 2s infinite' }}>
              LOADING...
            </div>
          </div>
        ) : !hero ? (
          <div style={styles.center}>
            <div style={{ background: '#27272a', border: '4px solid #dc2626', borderRadius: '12px', padding: '48px', maxWidth: '448px', width: '100%' }}>
              <h2 style={{ fontSize: '36px', fontWeight: '900', textAlign: 'center', marginBottom: '32px', color: '#ef4444' }}>
                CREATE FIGHTER
              </h2>
              <input
                type="text" placeholder="Enter fighter name..." value={heroName}
                onChange={(e) => setHeroName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateHero()}
                disabled={loading}
                style={{
                  width: '100%', padding: '16px 24px', background: '#000', border: '2px solid #ca8a04',
                  borderRadius: '8px', color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', outline: 'none'
                }}
              />
              <button onClick={handleCreateHero} disabled={loading} style={{
                width: '100%', padding: '16px 32px', background: 'linear-gradient(135deg, #dc2626, #ea580c)',
                border: 'none', borderRadius: '8px', color: 'white', fontWeight: '900', fontSize: '24px',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'all 0.3s',
                boxShadow: '0 0 20px rgba(220, 38, 38, 0.6)'
              }}>
                {loading ? 'CREATING...' : 'ENTER ARENA'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* HUD - Top Bar */}
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '24px', background: 'linear-gradient(180deg, rgba(24,24,27,0.95) 0%, rgba(0,0,0,0) 100%)',
              backdropFilter: 'blur(10px)', borderBottom: '3px solid #dc2626', zIndex: 100
            }}>
              <HealthBar name={hero.name} hp={hero.hp} level={hero.level} xp={hero.xp} />
              <div style={{ margin: '0 32px', fontSize: '24px', fontWeight: '700', color: '#475569', letterSpacing: '4px' }}>VS</div>
              <HealthBar name="BOT ENEMY" hp={enemyHp} level={enemyLevel} isEnemy />
            </div>

            <div style={{ height: '140px' }} />

            {/* Arena */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 48px', minHeight: '500px' }}>
              <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', marginBottom: '40px', padding: '0 100px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '2px' }}>{hero.name}</h2>
                <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#e2e8f0', letterSpacing: '2px' }}>BOT ENEMY</h2>
              </div>

              <div style={{ position: 'relative', width: '100%', maxWidth: '1200px', height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 100px' }}>
                {/* Platform */}
                <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '90%', height: '3px', background: 'linear-gradient(90deg, transparent, #475569 30%, #64748b 50%, #475569 70%, transparent)', borderRadius: '2px' }} />
                <div style={{ position: 'absolute', bottom: '-15px', left: '50%', transform: 'translateX(-50%)', width: '70%', height: '30px', background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)', filter: 'blur(15px)' }} />
                
                <Character icon="⚔" level={hero.level} isShaking={isShaking} badgePosition="right" />
                <Character icon="◆" level={enemyLevel} isShaking={isShaking} badgePosition="left" />
              </div>
            </div>

            {/* Controls */}
            <div style={{ background: 'linear-gradient(0deg, rgba(24,24,27,0.95) 0%, rgba(0,0,0,0) 100%)', padding: '32px', borderTop: '3px solid #dc2626' }}>
              <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '24px', justifyContent: 'center' }}>
                <ActionButton onClick={handleBattle} disabled={!canBattle} loading={loading}
                  label={hero.hp < MIN_HP_FOR_BATTLE ? 'INSUFFICIENT HP' : 'FIGHT'} loadingLabel="FIGHTING..." />
                <ActionButton onClick={handleHeal} disabled={loading} loading={loading} label="HEAL" loadingLabel="HEALING..." />
                <button onClick={() => setHero(null)} disabled={loading} style={{
                  padding: '14px 32px', background: 'transparent', border: '1px solid #334155', borderRadius: '6px',
                  color: '#94a3b8', fontWeight: '500', fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
                }}>NEW FIGHTER</button>
              </div>
              {hero.hp <= 0 && <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '18px', fontWeight: '600', color: '#ef4444', letterSpacing: '2px' }}>DEFEATED</div>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
