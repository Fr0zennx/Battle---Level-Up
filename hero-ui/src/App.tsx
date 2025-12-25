import { useState, useEffect } from 'react'
import './App.css'
import { useCurrentAccount, useSignAndExecuteTransactionBlock, ConnectButton } from '@mysten/dapp-kit'
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

function App() {
  const account = useCurrentAccount()
  const { mutate: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock()
  
  const [hero, setHero] = useState<Hero | null>(null)
  const [heroName, setHeroName] = useState('')
  const [loading, setLoading] = useState(false)

  // Kahraman oluşturma
  const handleCreateHero = () => {
    if (!heroName.trim() || !account) {
      alert('Lütfen kahraman adı girin ve cüzdanı bağlayın!')
      return
    }

    setLoading(true)
    const tx = new Transaction()
    
    // String'i vektöre çevir
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
          alert('Kahraman başarıyla oluşturuldu!')
        },
        onError: (error: any) => {
          console.error('Error:', error)
          alert('Hata: ' + error.message)
          setLoading(false)
        }
      }
    )
  }

  // Savaş yap
  const handleBattle = () => {
    if (!hero || !account || loading) return

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
          setHero(prev => {
            if (!prev) return prev
            const newXp = prev.xp + 20
            const newHp = Math.max(0, prev.hp - 20)

            if (newXp >= 100) {
              return {
                ...prev,
                hp: 100,
                xp: 0,
                level: prev.level + 1,
              }
            }

            return {
              ...prev,
              hp: newHp,
              xp: newXp,
            }
          })
          setLoading(false)
          alert('Savaş tamamlandı!')
        },
        onError: (error: any) => {
          console.error('Error:', error)
          alert('Hata: ' + error.message)
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
          setHero(prev => prev ? { ...prev, hp: 100 } : null)
          setLoading(false)
          alert('İyileşildi!')
        },
        onError: (error: any) => {
          console.error('Error:', error)
          alert('Hata: ' + error.message)
          setLoading(false)
        }
      }
    )
  }

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
            <h2>Başlamak için Cüzdanınızı Bağlayın</h2>
            <p>Sağ üstteki buton ile cüzdanınızı bağlayın ve oyuna başlayın.</p>
          </div>
        ) : !hero ? (
          <div className="hero-creation">
            <h2>Yeni Kahraman Oluştur</h2>
            <input
              type="text"
              placeholder="Kahraman adını girin..."
              value={heroName}
              onChange={(e) => setHeroName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateHero()}
              disabled={loading}
            />
            <button className="btn btn-success" onClick={handleCreateHero} disabled={loading}>
              {loading ? '⭐ Oluşturuluyor...' : '⭐ Kahraman Oluştur'}
            </button>
          </div>
        ) : (
          <div className="hero-panel">
            <div className="hero-card">
              <h2>{hero.name}</h2>
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
          </div>
        )}
      </div>

      <footer className="app-footer">
        <p>🚀 Sui Move Smart Contract ile yapılmıştır</p>
        <p className="package-info">
          Package ID: <code>{PACKAGE_ID}</code>
        </p>
      </footer>
    </div>
  )
}

export default App
