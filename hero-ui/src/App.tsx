import { useState, useEffect } from 'react'
import './App.css'
import { useCurrentAccount, useSignAndExecuteTransactionBlock, ConnectButton, useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'

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
  const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock()
  
  const [hero, setHero] = useState<Hero | null>(null)
  const [heroName, setHeroName] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingHero, setCheckingHero] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

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

    signAndExecuteTransactionBlock(
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
    const tx = new Transaction()

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::battle`,
      arguments: [tx.object(hero.id)],
    })

    signAndExecuteTransactionBlock(
      { transaction: tx },
      {
        onSuccess: (result: any) => {
          console.log('Battle result:', result)
          
          // Blockchain'den veriyi güncelle
          setTimeout(() => {
            refetchHeroData()
          }, 500)
          
          setLoading(false)
          addNotification(`⚔️ Savaş Kazanıldı! ⭐ XP +20 | ❤️ HP -20`, 'battle', 2500)
        },
        onError: (error: any) => {
          console.error('Error:', error)
          addNotification(`❌ Savaş başarısız: ${error.message}`, 'error', 4000)
          setLoading(false)
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

    signAndExecuteTransactionBlock(
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
    <div className="app-container">
      {/* Notification Konteyner */}
      <div className="notification-container">
        {notifications.map(notif => (
          <div key={notif.id} className={`notification notification-${notif.type}`}>
            {notif.message}
          </div>
        ))}
      </div>

      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>⚔️ Battle & Level Up</h1>
          <ConnectButton />
        </div>
        <p>Sui Testnet'te Kahraman Oyunu</p>
      </header>

      <div className="content">
        {!account ? (
          <div className="wallet-section">
            <h2>👛 Cüzdanı Bağla</h2>
            <p>Oyuna başlamak için sağ üstteki buton ile Sui cüzdanınızı bağlayın.</p>
          </div>
        ) : checkingHero ? (
          <div className="wallet-section">
            <h2>⏳ Yükleniyor...</h2>
            <p>Cüzdanınız kontrol ediliyor...</p>
          </div>
        ) : !hero ? (
          <div className="hero-creation">
            <h2>⭐ Yeni Kahraman Oluştur</h2>
            <p style={{ marginBottom: '20px', opacity: 0.8 }}>
              Oyuna başlamak için ilk kahramanınızı oluşturun.
            </p>
            <input
              type="text"
              placeholder="Kahraman adını girin..."
              value={heroName}
              onChange={(e) => setHeroName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleCreateHero()}
              disabled={loading}
              maxLength={20}
            />
            <button className="btn btn-success" onClick={handleCreateHero} disabled={loading}>
              {loading ? '⏳ Oluşturuluyor...' : '⭐ Kahraman Oluştur'}
            </button>
            <p style={{ marginTop: '15px', fontSize: '0.9em', opacity: 0.7 }}>
              💡 Kahraman adı maksimum 20 karakter olabilir.
            </p>
          </div>
        ) : (
          <div className="hero-panel">
            <div className="battlefield">
              {/* Sol Taraf - Kahraman */}
              <div className="battlefield-left">
                <div className="hero-card">
                  <h2>🗡️ {hero.name}</h2>
                  <div className="hero-stats">
                    <div className="stat">
                      <span className="label">❤️ HP:</span>
                      <span className="value">{hero.hp}/100</span>
                    </div>
                    <div className="stat">
                      <span className="label">⭐ XP:</span>
                      <span className="value">{hero.xp}/100</span>
                    </div>
                    <div className="stat">
                      <span className="label">📊 Level:</span>
                      <span className="value">{hero.level}</span>
                    </div>
                  </div>

                  <div className="hp-bar">
                    <div className="hp-fill" style={{ width: `${hero.hp}%` }}></div>
                  </div>

                  <div className="xp-bar">
                    <div className="xp-fill" style={{ width: `${hero.xp}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Ortada VS */}
              <div className="battlefield-center">
                <div className="vs-text">VS</div>
              </div>

              {/* Sağ Taraf - Bot/Düşman */}
              <div className="battlefield-right">
                <div className="enemy-card">
                  <div className="enemy-avatar">
                    <span className="enemy-emoji">🐉</span>
                  </div>
                  <h2>Bot Düşman</h2>
                  <div className="enemy-stats">
                    <div className="stat">
                      <span className="label">HP:</span>
                      <span className="value">100/100</span>
                    </div>
                    <div className="stat">
                      <span className="label">Level:</span>
                      <span className="value">{Math.floor(hero.level / 2) + 1}</span>
                    </div>
                  </div>
                  <div className="hp-bar">
                    <div className="hp-fill" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button 
                className="btn btn-danger" 
                onClick={handleBattle} 
                disabled={loading || hero.hp < 20}
                title={hero.hp < 20 ? "HP çok düşük! Önce iyileş." : "Bot ile savaş: XP +20, HP -20"}
              >
                {loading ? '⚔️ Savaş Devam Ediyor...' : '⚔️ Savaş Yap'}
              </button>
              <button 
                className="btn btn-info" 
                onClick={handleHeal} 
                disabled={loading}
                title="HP'yi 100'e döndür"
              >
                {loading ? '💚 İyileşiyor...' : '💚 İyileş'}
              </button>
            </div>

            {hero.hp <= 0 && (
              <div className="game-over">
                <p>💀 Kahraman Yenilmiş!</p>
              </div>
            )}

            <button className="btn btn-secondary" onClick={() => setHero(null)} disabled={loading}>
              Yeni Kahraman Oluştur
            </button>

            <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', fontSize: '0.85em', opacity: 0.7 }}>
              <p>Hero ID: <code style={{ fontSize: '0.8em' }}>{hero.id.substring(0, 16)}...</code></p>
            </div>
          </div>
        )}
      </div>

      <footer className="app-footer">
        <p>🚀 Sui Move Smart Contract ile yapılmıştır</p>
        <p className="package-info">
          Package ID: <code>{PACKAGE_ID.substring(0, 16)}...</code>
        </p>
      </footer>
    </div>
  )
}

export default App

  return (
    <div className="app-container">
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>⚔️ Battle & Level Up</h1>
          <ConnectButton />
        </div>
        <p>Sui Testnet'te Kahraman Oyunu</p>
      </header>

      <div className="content">
        {!account ? (
          <div className="wallet-section">
            <h2>👛 Cüzdanı Bağla</h2>
            <p>Oyuna başlamak için sağ üstteki buton ile Sui cüzdanınızı bağlayın.</p>
          </div>
        ) : checkingHero ? (
          <div className="wallet-section">
            <h2>⏳ Yükleniyor...</h2>
            <p>Cüzdanınız kontrol ediliyor...</p>
          </div>
        ) : !hero ? (
          <div className="hero-creation">
            <h2>⭐ Yeni Kahraman Oluştur</h2>
            <p style={{ marginBottom: '20px', opacity: 0.8 }}>
              Oyuna başlamak için ilk kahramanınızı oluşturun.
            </p>
            <input
              type="text"
              placeholder="Kahraman adını girin..."
              value={heroName}
              onChange={(e) => setHeroName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleCreateHero()}
              disabled={loading}
              maxLength={20}
            />
            <button className="btn btn-success" onClick={handleCreateHero} disabled={loading}>
              {loading ? '⏳ Oluşturuluyor...' : '⭐ Kahraman Oluştur'}
            </button>
            <p style={{ marginTop: '15px', fontSize: '0.9em', opacity: 0.7 }}>
              💡 Kahraman adı maksimum 20 karakter olabilir.
            </p>
          </div>
        ) : (
          <div className="hero-panel">
            <div className="battlefield">
              {/* Sol Taraf - Kahraman */}
              <div className="battlefield-left">
                <div className="hero-card">
                  <h2>🗡️ {hero.name}</h2>
                  <div className="hero-stats">
                    <div className="stat">
                      <span className="label">❤️ HP:</span>
                      <span className="value">{hero.hp}/100</span>
                    </div>
                    <div className="stat">
                      <span className="label">⭐ XP:</span>
                      <span className="value">{hero.xp}/100</span>
                    </div>
                    <div className="stat">
                      <span className="label">📊 Level:</span>
                      <span className="value">{hero.level}</span>
                    </div>
                  </div>

                  <div className="hp-bar">
                    <div className="hp-fill" style={{ width: `${hero.hp}%` }}></div>
                  </div>

                  <div className="xp-bar">
                    <div className="xp-fill" style={{ width: `${hero.xp}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Ortada VS */}
              <div className="battlefield-center">
                <div className="vs-text">VS</div>
              </div>

              {/* Sağ Taraf - Bot/Düşman */}
              <div className="battlefield-right">
                <div className="enemy-card">
                  <div className="enemy-avatar">
                    <span className="enemy-emoji">🐉</span>
                  </div>
                  <h2>Bot Düşman</h2>
                  <div className="enemy-stats">
                    <div className="stat">
                      <span className="label">HP:</span>
                      <span className="value">100/100</span>
                    </div>
                    <div className="stat">
                      <span className="label">Level:</span>
                      <span className="value">{Math.floor(hero.level / 2) + 1}</span>
                    </div>
                  </div>
                  <div className="hp-bar">
                    <div className="hp-fill" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="btn btn-danger" onClick={handleBattle} disabled={loading || hero.hp < 20}>
                {loading ? '⚔️ Savaş Devam Ediyor...' : '⚔️ Savaş Yap'}
              </button>
              <button className="btn btn-info" onClick={handleHeal} disabled={loading}>
                {loading ? '💚 İyileşiyor...' : '💚 İyileş'}
              </button>
            </div>

            {hero.hp <= 0 && (
              <div className="game-over">
                <p>💀 Kahraman Yenilmiş!</p>
              </div>
            )}

            <button className="btn btn-secondary" onClick={() => setHero(null)} disabled={loading}>
              Yeni Kahraman Oluştur
            </button>

            <div style={{ marginTop: '20px', padding: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', fontSize: '0.85em', opacity: 0.7 }}>
              <p>Hero ID: <code style={{ fontSize: '0.8em' }}>{hero.id.substring(0, 16)}...</code></p>
            </div>
          </div>
        )}
      </div>

      <footer className="app-footer">
        <p>🚀 Sui Move Smart Contract ile yapılmıştır</p>
        <p className="package-info">
          Package ID: <code>{PACKAGE_ID.substring(0, 16)}...</code>
        </p>
      </footer>
    </div>
  )
}

export default App
