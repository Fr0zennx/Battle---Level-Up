module battle_and_level_up::game {
    use sui::object::{UID};
    use sui::tx_context::{TxContext};
    use sui::transfer;
    use std::string::{String, utf8};

    /* --- VERİ YAPISI --- */

    public struct Hero has key, store {
        id: UID,
        name: String,
        hp: u64,
        xp: u64,
        level: u64,
    }

    /* --- FONKSİYONLAR --- */

    // 1. Kahraman Oluşturma (Mint)
    public fun create_hero(name: vector<u8>, ctx: &mut TxContext) {
        let hero = Hero {
            id: sui::object::new(ctx),
            name: utf8(name),
            hp: 100,
            xp: 0,
            level: 1,
        };
        transfer::public_transfer(hero, sui::tx_context::sender(ctx));
    }

    // 2. Savaş Mantığı (Hero vs Bot)
    // &mut Hero kullanarak kahramanı güncelliyoruz.
    public fun battle(hero: &mut Hero) {
        // Can kontrolü: Canı bitmiş bir kahraman savaşamaz.
        assert!(hero.hp >= 20, 101); 

        // Savaş simülasyonu:
        // Şimdilik her savaşı kazandığını ve 20 XP aldığını varsayıyoruz.
        // Karşılığında bot kahramana 20 hasar veriyor.
        hero.xp = hero.xp + 20;
        hero.hp = hero.hp - 20;

        // Seviye Atlama: 100 XP'ye ulaşınca seviye artar, HP dolar.
        if (hero.xp >= 100) {
            hero.level = hero.level + 1;
            hero.xp = 0;
            hero.hp = 100;
        };
    }

    // 3. İyileşme (Heal)
    public fun heal(hero: &mut Hero) {
        hero.hp = 100;
    }
}


