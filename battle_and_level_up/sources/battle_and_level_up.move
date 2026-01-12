module battle_and_level_up::game {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};

    /* --- CHAPTER 1: DATA STRUCTURE --- */
    /// Mission: Define the attributes a Hero should have.
    /// Requirements: 
    /// 1. The struct must have 'key' and 'store' abilities.
    /// 2. Fields: id (UID), name (String), hp (u64), xp (u64), level (u64).
    public struct Hero has key, store {
        id: UID,
        // TODO: Add name, hp, xp, and level fields here.
        
    }

    /* --- CHAPTER 2: MINTING (CREATION) --- */
    /// Mission: Create a new Hero object and transfer it to the sender.
    /// Steps:
    /// 1. Initialize a Hero with: HP = 100, XP = 0, Level = 1.
    /// 2. Use 'transfer::public_transfer' to send the hero to the tx sender.
    public entry fun create_hero(name_bytes: vector<u8>, ctx: &mut TxContext) {
        // TODO: Create the Hero instance
        
        // TODO: Transfer the Hero to the sender (use tx_context::sender(ctx))

    }

    /* --- CHAPTER 3: BATTLE LOGIC --- */
    /// Mission: Handle combat results and level-up mechanics.
    /// Steps:
    /// 1. Safety Check: Ensure hero.hp is at least 20 using 'assert!'.
    /// 2. Simulation: Increase XP by 50 and decrease HP by 20.
    /// 3. Level Up: If XP >= 100, increment level, reset XP to 0, and refill HP to 100.
    public entry fun battle(hero: &mut Hero) {
        // TODO: Add an assertion to check if HP >= 20
        
        // TODO: Update XP and HP values
        
        // TODO: Check for level up (if XP >= 100)

    }

    /* --- CHAPTER 4: HEALING --- */
    /// Mission: Restore the hero's health (HP) to its maximum value.
    public entry fun heal(hero: &mut Hero) {
        // TODO: Reset the hero's HP to 100
        
    }
}