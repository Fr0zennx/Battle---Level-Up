module battle_and_level_up::game {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String, utf8};

    /* --- CHAPTER 1: DATA STRUCTURE --- */
    /// Mission: Define the attributes a Hero should have.
    // Nesnenin hem taşınabilir (store) hem de global depolama alanı olabilir (key) olduğunu belirttik.
    public struct Hero has key, store {
        id: UID,
        name: String,
        hp: u64,
        xp: u64,
        level: u64,
    }

    /* --- CHAPTER 2: MINTING (CREATION) --- */
    /// Mission: Create a new Hero object and transfer it to the sender.
    public entry fun create_hero(name: vector<u8>, ctx: &mut TxContext) {
        // 1. Yeni bir Hero nesnesini varsayılan değerlerle başlattık.
        let hero = Hero {
            id: object::new(ctx),
            name: string::utf8(name),
            hp: 100,      // Başlangıç Canı
            xp: 0,        // Başlangıç Tecrübesi
            level: 1,     // Başlangıç Seviyesi
        };
        
        // 2. Kahramanı işlemi başlatan kişiye (sender) transfer ettik.
        transfer::public_transfer(hero, tx_context::sender(ctx));
    }

    /* --- CHAPTER 3: BATTLE LOGIC --- */
    /// Mission: Implement XP gain, HP loss, and level-up checks.
    public entry fun battle(hero: &mut Hero) {
        // 1. Güvenlik Kontrolü: Kahramanın savaşmak için yeterli canı (HP) var mı? (En az 20 olmalı)
        assert!(hero.hp >= 20, 0); // HP 20'den düşükse işlem iptal edilir (Error code: 0)
        
        // 2. Savaş Simülasyonu: XP artışı ve HP kaybı
        hero.xp = hero.xp + 50;  // Her savaş 50 XP kazandırır
        hero.hp = hero.hp - 20;  // Her savaş 20 HP götürür
        
        // 3. Level Up Koşulu: XP 100'e ulaştığında seviye atla
        if (hero.xp >= 100) {
            hero.level = hero.level + 1; // Seviye artır
            hero.xp = 0;                 // XP'yi sıfırla
            hero.hp = 100;               // Seviye atlayınca canı tamamen doldur
        }
    }

    /* --- CHAPTER 4: HEALING --- */
    /// Mission: Restore the hero's health (HP) to its maximum value.
    public entry fun heal(hero: &mut Hero) {
        // Kahramanın HP alanını tekrar maksimum olan 100'e güncelledik.
        hero.hp = 100;
    }
}           