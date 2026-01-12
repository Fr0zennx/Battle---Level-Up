import { useState, useEffect } from 'react'
import './App.css'
import { useCurrentAccount, useSignAndExecuteTransaction, ConnectButton, useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import LightPillar from './LightPillar'

// PACKAGE_ID'yi Testnet'e publish ettikten sonra buraya yapıştırın
const PACKAGE_ID = "0x502257663195f5d5c0ff3f3ea8936727ea5c8914e265e0008e26659cac7cbe08"
const MODULE_NAME = "game"

interface Hero {
  id: string
  name: string
  hp: number
  xp: number
  level: number
}

interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'battle'
  duration: number
}

function App() {
  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  
  const [hero, setHero] = useState<Hero | null>(null)
  const [heroName, setHeroName] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingHero, setCheckingHero] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [enemyHp, setEnemyHp] = useState(100)
  const [isShaking, setIsShaking] = useState(false)

  // Blockchain'den hero verilerini çekmek için query
  const { data: heroObjectData, refetch: refetchHeroData, isPending: isFetchingHero } = useSuiClientQuery(
    'getObject',
    hero?.id ? {
      id: hero.id,
      options: {
        showContent: true,
      },
    } : null,
    {
      enabled: !!hero?.id,
      refetchInterval: 2000, // Her 2 saniyede bir otomatik refetch
    }
  )

  // Hero object'ini parse et ve state'i güncelle
  useEffect(() => {
    if (heroObjectData?.data?.content?.dataType === 'moveObject' && hero) {
      const heroData = heroObjectData.data.content.fields as any
      const updatedHero: Hero = {
        id: hero.id,
        name: heroData.name || hero.name,
        hp: heroData.hp || 0,
        xp: heroData.xp || 0,
        level: heroData.level || 1,
      }
      
      // Sadece veriler gerçekten değişmişse güncelle
      if (
        updatedHero.hp !== hero.hp ||
        updatedHero.xp !== hero.xp ||
        updatedHero.level !== hero.level
      ) {
        setHero(updatedHero)
      }
    }
  }, [heroObjectData])

  // Notification sistem
  const addNotification = (message: string, type: 'success' | 'error' | 'info' | 'battle' = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(7)
    const notification: Notification = { id, message, type, duration }
    setNotifications(prev => [...prev, notification])
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, duration)
  }

  // Cüzdandaki Hero nesnelerini kontrol et
  useEffect(() => {
    if (!account) {
      setHero(null)
      return
    }

    const checkHeroes = async () => {
      setCheckingHero(true)
      try {
        const objects = await suiClient.getOwnedObjects({
          owner: account.address,
          filter: {
            StructType: `${PACKAGE_ID}::${MODULE_NAME}::Hero`,
          },
          options: {
            showContent: true,
          },
        })

        if (objects.data && objects.data.length > 0) {
          const heroObj = objects.data[0]
          if (heroObj.data?.content?.dataType === 'moveObject') {
            const heroData = heroObj.data.content.fields as any
            setHero({
              id: heroObj.data.objectId,
              name: heroData.name || 'Unknown',
              hp: heroData.hp || 100,
              xp: heroData.xp || 0,
              level: heroData.level || 1,
            })
          }
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

  // Kahraman oluşturma
  const handleCreateHero = () => {
    if (!heroName.trim() || !account) {
      addNotification('Lütfen kahraman adı girin ve cüzdanı bağlayın!', 'error')
      return
    }

    setLoading(true)
    const tx = new Transaction()
    
    // String'i u8 vektörüne çevir
    const heroNameBytes = Array.from(heroName).map(c => c.charCodeAt(0))
    
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::create_hero`,
      arguments: [tx.pure.vector("u8", heroNameBytes)],
    })

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result: any) => {
          console.log('Hero created:', result)
          const newHero: Hero = {
            id: result.digest || Math.random().toString(36).substring(7),
            name: heroName,
            hp: 100,
            xp: 0,
            level: 1,
          }
          setHero(newHero)
          setHeroName('')
          setLoading(false)
          addNotification(`⭐ ${heroName} başarıyla oluşturuldu!`, 'success', 2000)
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        },
        onError: (error: any) => {
          console.error('Error:', error)
          addNotification(`❌ Kahraman oluşturulamadı: ${error.message}`, 'error', 4000)
          setLoading(false)
        }
      }
    )
  }

  // Savaş yap
  const handleBattle = () => {
    if (!hero || !account || loading) return

    if (hero.hp < 20) {
      addNotification('❌ HP çok düşük! Önce iyileş!', 'error')
      return
    }

    setLoading(true)
    setIsShaking(true)
    
    // Düşman HP'sini azalt (10-30 arası rastgele hasar)
    const damage = Math.floor(Math.random() * 21) + 10
    setEnemyHp(prev => Math.max(0, prev - damage))
    
    const tx = new Transaction()

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::battle`,
      arguments: [tx.object(hero.id)],
    })

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result: any) => {
          console.log('Battle result:', result)
          
          // Blockchain'den veriyi güncelle
          setTimeout(() => {
            refetchHeroData()
          }, 500)
          
          // Shake animasyonunu kaldır
          setTimeout(() => setIsShaking(false), 600)
          
          setLoading(false)
          addNotification(`⚔️ Savaş Kazanıldı! 💥 Düşmana ${damage} hasar! ⭐ XP +20 | ❤️ HP -20`, 'battle', 2500)
        },
        onError: (error: any) => {
          console.error('Error:', error)
          addNotification(`❌ Savaş başarısız: ${error.message}`, 'error', 4000)
          setLoading(false)
          setIsShaking(false)
        }
      }
    )
  }

  // İyileş
  const handleHeal = () => {
    if (!hero || !account || loading) return

    setLoading(true)
    const tx = new Transaction()

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::heal`,
      arguments: [tx.object(hero.id)],
    })

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (result: any) => {
          console.log('Heal result:', result)
          
          // Blockchain'den veriyi güncelle
          setTimeout(() => {
            refetchHeroData()
          }, 500)
          
          setLoading(false)
          addNotification(`💚 İyileşildi! HP 100'e döndürüldü!`, 'success', 2000)
        },
        onError: (error: any) => {
          console.error('Error:', error)
          addNotification(`❌ İyileşme başarısız: ${error.message}`, 'error', 4000)
          setLoading(false)
        }
      }
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000000',
      fontFamily: 'Arial, sans-serif',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background - LightPillar */}
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: 0.6
      }}>
        <LightPillar
          topColor="#1e293b"
          bottomColor="#475569"
          intensity={0.6}
          rotationSpeed={0.15}
          glowAmount={0.004}
          pillarWidth={5.0}
          pillarHeight={0.6}
          noiseIntensity={0.2}
          pillarRotation={0}
          interactive={false}
          mixBlendMode="overlay"
        />
      </div>

      {/* Main Content - Above Background */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Notifications */}
      <div style={{ position: 'fixed', top: '80px', right: '16px', zIndex: 50 }}>
        {notifications.map(notif => (
          <div key={notif.id} style={{
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '8px',
            borderLeft: `4px solid ${notif.type === 'success' ? '#4ade80' : notif.type === 'error' ? '#f87171' : notif.type === 'battle' ? '#fbbf24' : '#60a5fa'}`,
            background: notif.type === 'success' ? '#16a34a' : notif.type === 'error' ? '#dc2626' : notif.type === 'battle' ? '#a855f7' : '#2563eb',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
          }}>
            {notif.message}
          </div>
        ))}
      </div>

      {!account ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ 
              fontSize: '72px', 
              fontWeight: '900', 
              marginBottom: '32px',
              background: 'linear-gradient(45deg, #dc2626, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(220, 38, 38, 0.8)'
            }}>MORTAL BATTLE</h1>
            <ConnectButton />
          </div>
        </div>
      ) : checkingHero ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            fontSize: '48px', 
            fontWeight: '900', 
            color: '#fbbf24',
            animation: 'pulse 2s infinite'
          }}>LOADING...</div>
        </div>
      ) : !hero ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            background: '#27272a', 
            border: '4px solid #dc2626', 
            borderRadius: '12px', 
            padding: '48px',
            maxWidth: '448px',
            width: '100%'
          }}>
            <h2 style={{ 
              fontSize: '36px', 
              fontWeight: '900', 
              textAlign: 'center', 
              marginBottom: '32px',
              color: '#ef4444'
            }}>CREATE FIGHTER</h2>
            <input
              type="text"
              placeholder="Enter fighter name..."
              value={heroName}
              onChange={(e) => setHeroName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateHero()}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: '#000000',
                border: '2px solid #ca8a04',
                borderRadius: '8px',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '24px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleCreateHero}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #dc2626, #ea580c)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '900',
                fontSize: '24px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.3s',
                boxShadow: '0 0 20px rgba(220, 38, 38, 0.6)'
              }}
            >
              {loading ? 'CREATING...' : 'ENTER ARENA'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* HUD - Top Bar - FIXED */}
          <div style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '24px',
            background: 'linear-gradient(180deg, rgba(24,24,27,0.95) 0%, rgba(0,0,0,0) 100%)',
            backdropFilter: 'blur(10px)',
            borderBottom: '3px solid #dc2626',
            zIndex: 100
          }}>
            {/* Player Health Bar - Left */}
            <div style={{ flex: 1, maxWidth: '400px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: '#94a3b8', letterSpacing: '0.5px' }}>
                {hero.name.toUpperCase()}
              </div>
              <div style={{ 
                position: 'relative', 
                width: '100%', 
                height: '8px', 
                background: '#1e293b',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #334155'
              }}>
                <div style={{
                  height: '100%',
                  width: `${hero.hp}%`,
                  background: hero.hp > 60 ? '#10b981' : hero.hp > 30 ? '#f59e0b' : '#ef4444',
                  transition: 'width 0.4s ease',
                  boxShadow: 'none'
                }}></div>
              </div>
              <div style={{ fontSize: '10px', fontWeight: '500', marginTop: '4px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>HP: {hero.hp}/100</span>
                <span>LVL {hero.level} | XP: {hero.xp}/100</span>
              </div>
            </div>

            {/* VS - Center */}
            <div style={{ margin: '0 32px' }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '700',
                color: '#475569',
                letterSpacing: '4px'
              }}>VS</div>
            </div>

            {/* Enemy Health Bar - Right */}
            <div style={{ flex: 1, maxWidth: '400px', textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '6px', color: '#94a3b8', letterSpacing: '0.5px' }}>
                BOT ENEMY
              </div>
              <div style={{ 
                position: 'relative', 
                width: '100%', 
                height: '8px', 
                background: '#1e293b',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid #334155'
              }}>
                <div style={{
                  height: '100%',
                  width: `${enemyHp}%`,
                  background: enemyHp > 60 ? '#06b6d4' : enemyHp > 30 ? '#f59e0b' : '#ef4444',
                  transition: 'width 0.5s ease',
                  boxShadow: 'none'
                }}></div>
              </div>
              <div style={{ fontSize: '10px', fontWeight: '500', marginTop: '4px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>LVL {Math.floor(hero.level / 2) + 1}</span>
                <span>HP: {enemyHp}/100</span>
              </div>
            </div>
          </div>

          {/* Spacer for Fixed Header */}
          <div style={{ height: '140px' }}></div>

          {/* Arena Platform - Middle */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '0 48px',
            minHeight: '500px',
            position: 'relative'
          }}>
            {/* Character Names Above */}
            <div style={{ 
              width: '100%',
              maxWidth: '1200px',
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '40px',
              paddingLeft: '100px',
              paddingRight: '100px'
            }}>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '700',
                color: '#e2e8f0',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                {hero.name}
              </h2>
              <h2 style={{ 
                fontSize: '28px', 
                fontWeight: '700',
                color: '#e2e8f0',
                letterSpacing: '2px'
              }}>
                BOT ENEMY
              </h2>
            </div>

            {/* Battle Platform */}
            <div style={{ 
              position: 'relative',
              width: '100%',
              maxWidth: '1200px',
              height: '300px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              paddingLeft: '100px',
              paddingRight: '100px'
            }}>
              {/* Platform Ground */}
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '90%',
                height: '3px',
                background: 'linear-gradient(90deg, transparent, #475569 30%, #64748b 50%, #475569 70%, transparent)',
                borderRadius: '2px',
                boxShadow: '0 2px 10px rgba(71, 85, 105, 0.3)'
              }}></div>

              {/* Platform Shadow */}
              <div style={{
                position: 'absolute',
                bottom: '-15px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '70%',
                height: '30px',
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
                filter: 'blur(15px)'
              }}></div>

              {/* Player Character */}
              <div style={{ 
                position: 'relative',
                zIndex: 10,
                animation: isShaking ? 'shake 0.5s ease-in-out' : 'none'
              }}>
                {/* Character Box */}
                <div style={{ 
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
                }}>
                  {/* Character Icon */}
                  <div style={{
                    fontSize: '80px',
                    color: '#64748b',
                    fontWeight: 'bold'
                  }}>⚔</div>
                  {/* Inner Glow */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at center, rgba(100,116,139,0.1) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }}></div>
                </div>
                {/* Character Shadow */}
                <div style={{
                  position: 'absolute',
                  bottom: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '100px',
                  height: '20px',
                  background: 'radial-gradient(ellipse, rgba(0, 0, 0, 0.3) 0%, transparent 70%)',
                  borderRadius: '50%',
                  filter: 'blur(8px)'
                }}></div>
                {/* Level Badge */}
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: '#334155',
                  color: '#e2e8f0',
                  fontWeight: '600',
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid #475569',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                }}>LV {hero.level}</div>
              </div>

              {/* Enemy Character */}
              <div style={{ 
                position: 'relative',
                zIndex: 10,
                animation: isShaking ? 'shake 0.5s ease-in-out' : 'none'
              }}>
                {/* Character Box */}
                <div style={{ 
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
                }}>
                  {/* Character Icon */}
                  <div style={{
                    fontSize: '80px',
                    color: '#64748b',
                    fontWeight: 'bold'
                  }}>◆</div>
                  {/* Inner Glow */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at center, rgba(100,116,139,0.1) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }}></div>
                </div>
                {/* Character Shadow */}
                <div style={{
                  position: 'absolute',
                  bottom: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '100px',
                  height: '20px',
                  background: 'radial-gradient(ellipse, rgba(0, 0, 0, 0.3) 0%, transparent 70%)',
                  borderRadius: '50%',
                  filter: 'blur(8px)'
                }}></div>
                {/* Level Badge */}
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '-8px',
                  background: '#334155',
                  color: '#e2e8f0',
                  fontWeight: '600',
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid #475569',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                }}>LV {Math.floor(hero.level / 2) + 1}</div>
              </div>
            </div>


          </div>

          {/* Control Panel - Bottom */}
          <div style={{ 
            background: 'linear-gradient(0deg, rgba(24,24,27,0.95) 0%, rgba(0,0,0,0) 100%)',
            padding: '32px',
            borderTop: '3px solid #dc2626'
          }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '24px', justifyContent: 'center' }}>
              {/* Battle Button */}
              <button
                onClick={handleBattle}
                disabled={loading || hero.hp < 20}
                style={{
                  padding: '14px 40px',
                  background: loading || hero.hp < 20 ? '#1e293b' : '#334155',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: loading || hero.hp < 20 ? '#64748b' : '#e2e8f0',
                  fontWeight: '600',
                  fontSize: '14px',
                  letterSpacing: '1px',
                  cursor: loading || hero.hp < 20 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!loading && hero.hp >= 20) {
                    e.currentTarget.style.background = '#475569';
                    e.currentTarget.style.borderColor = '#64748b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && hero.hp >= 20) {
                    e.currentTarget.style.background = '#334155';
                    e.currentTarget.style.borderColor = '#475569';
                  }
                }}
              >
                {loading ? 'FIGHTING...' : hero.hp < 20 ? 'INSUFFICIENT HP' : 'FIGHT'}
              </button>

              {/* Heal Button */}
              <button
                onClick={handleHeal}
                disabled={loading}
                style={{
                  padding: '14px 40px',
                  background: loading ? '#1e293b' : '#334155',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: loading ? '#64748b' : '#e2e8f0',
                  fontWeight: '600',
                  fontSize: '14px',
                  letterSpacing: '1px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#475569';
                    e.currentTarget.style.borderColor = '#64748b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#334155';
                    e.currentTarget.style.borderColor = '#475569';
                  }
                }}
              >
                {loading ? 'HEALING...' : 'HEAL'}
              </button>

              {/* New Fighter Button */}
              <button
                onClick={() => setHero(null)}
                disabled={loading}
                style={{
                  padding: '14px 32px',
                  background: 'transparent',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  fontWeight: '500',
                  fontSize: '13px',
                  letterSpacing: '0.5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.borderColor = '#475569';
                    e.currentTarget.style.color = '#cbd5e1';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#334155';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                NEW FIGHTER
              </button>
            </div>

            {hero.hp <= 0 && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#ef4444',
                  letterSpacing: '2px'
                }}>
                  DEFEATED
                </div>
              </div>
            )}
          </div>

          {/* CSS Animations */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes breathe {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.05); opacity: 0.95; }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0) rotate(0deg); }
              10%, 30%, 50%, 70%, 90% { transform: translateX(-10px) rotate(-2deg); }
              20%, 40%, 60%, 80% { transform: translateX(10px) rotate(2deg); }
            }
          `}} />
        </>
      )}
      </div>
    </div>
  )
}

export default App
