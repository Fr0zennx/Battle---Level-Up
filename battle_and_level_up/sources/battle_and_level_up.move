module battle_and_level_up::game {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String, utf8};

    /* --- CHAPTER 1: DATA STRUCTURE --- */
    /// Mission: Define the attributes a Hero should have.
    /// Requirements: id, name, hp, xp, level. 
    /// Remember to use 'key' and 'store' abilities for a Sui Object!
    public struct Hero has key, store {
        id: UID,
        // GÖREV: Buraya name, hp, xp ve level alanlarını ekle.
        
    }

    /* --- CHAPTER 2: MINTING (CREATION) --- */
    /// Mission: Create a new Hero object and transfer it to the sender.
    public entry fun create_hero(name: vector<u8>, ctx: &mut TxContext) {
        // 1. GÖREV: Yeni bir Hero nesnesi oluştur (Varsayılan: HP 100, XP 0, Level 1)
        
        // 2. GÖREV: Oluşturulan kahramanı işlemi başlatan kişiye (sender) transfer et.

    }

    /* --- CHAPTER 3: BATTLE LOGIC --- */
    /// Mission: Implement XP gain, HP loss, and level-up checks.
    public entry fun battle(hero: &mut Hero) {
        // 1. GÖREV: Güvenlik Kontrolü ekle! Kahramanın HP'si 20'den azsa savaşamasın. (assert! kullan)
        
        // 2. GÖREV: Savaş sonucunda XP'yi 50 artır, HP'yi 20 azalt.
        
        // 3. GÖREV: Seviye Atlama Kontrolü! 
        // Eğer XP >= 100 ise; Level'ı 1 artır, XP'yi sıfırla ve HP'yi 100'e (full) getir.

    }

    /* --- CHAPTER 4: HEALING --- */
    /// Mission: Restore the hero's health (HP) to its maximum value.
    public entry fun heal(hero: &mut Hero) {
        // GÖREV: Kahramanın HP değerini tekrar 100'e eşitle.
        
    }
}