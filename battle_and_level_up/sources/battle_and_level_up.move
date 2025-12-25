module battle_and_level_up::game {
    use sui::object::{UID};
    use sui::tx_context::{TxContext};
    use sui::transfer;
    use std::string::{String, utf8};

    /* --- CHAPTER 1: DATA STRUCTURE --- */
    /// Mission: Define the attributes a Hero should have.
    public struct Hero has key, store {
        id: UID,
        name: String,
        // TODO: Add hp, xp, and level fields here (all u64)
    }

    /* --- CHAPTER 2: MINTING (CREATION) --- */
    /// Mission: Create a new Hero object and transfer it to the sender.
    public fun create_hero(name: vector<u8>, ctx: &mut TxContext) {
        // TODO: 1. Initialize a new Hero object with default values
        // (HP: 100, XP: 0, Level: 1)
        
        // TODO: 2. Transfer the hero to the transaction sender 
        // using transfer::public_transfer
    }

    /* --- CHAPTER 3: BATTLE LOGIC --- */
    /// Mission: Implement XP gain, HP loss, and level-up checks.
    public fun battle(hero: &mut Hero) {
        // TODO: 1. Add an assertion to check if the hero's HP is high enough to fight (e.g., >= 20)
        
        // TODO: 2. Simulate the battle by increasing XP and decreasing HP
        
        // TODO: 3. Create a Level Up condition: 
        // If XP reaches 100, increase Level, reset XP to 0, and restore HP to 100.
    }

    /* --- CHAPTER 4: HEALING --- */
    /// Mission: Restore the hero's health (HP) to its maximum value.
    public fun heal(hero: &mut Hero) {
        // TODO: Update the hero's HP field back to 100
    }
}