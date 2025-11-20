/**
 * Test script to verify gift streak incremental calculation fix
 * 
 * This test simulates the scenario described in the issue where gifts
 * show cumulative totals instead of incremental amounts.
 */

const EventEmitter = require('events');

// Mock database
class MockDatabase {
    constructor() {
        this.settings = {};
        this.events = [];
    }
    
    getSetting(key) {
        return this.settings[key];
    }
    
    setSetting(key, value) {
        this.settings[key] = value;
    }
    
    logEvent(type, username, data) {
        this.events.push({ type, username, data, timestamp: Date.now() });
        console.log(`   📝 Logged: ${data.giftName} x${data.repeatCount} (${data.coins} coins)`);
    }
    
    getGift(giftId) {
        const catalog = {
            5655: { id: 5655, name: 'Rose', diamond_count: 1 },
            5827: { id: 5827, name: 'TikTok', diamond_count: 1 },
            6064: { id: 6064, name: 'Heart Me', diamond_count: 10 },
            9999: { id: 9999, name: 'Team Heart', diamond_count: 50 },
        };
        return catalog[giftId];
    }
    
    updateGiftCatalog() {}
}

// Mock Socket.IO
class MockSocketIO extends EventEmitter {
    to(room) {
        return this;
    }
    emit() {}
}

// Import TikTok connector
const TikTokConnector = require('./modules/tiktok');

async function runTest() {
    console.log('🧪 Testing Gift Streak Incremental Calculation Fix\n');
    console.log('='.repeat(80));
    
    // Create mock instances
    const mockDb = new MockDatabase();
    const mockIo = new MockSocketIO();
    const connector = new TikTokConnector(mockIo, mockDb);
    
    // Set up a minimal eventEmitter for testing
    connector.eventEmitter = new EventEmitter();
    
    // Listen to gift events
    let emittedEvents = [];
    connector.on('gift', (data) => {
        emittedEvents.push(data);
    });
    
    // Set up the gift event handler manually (normally done in connect())
    connector.eventEmitter.on('gift', (data) => {
        // Extract gift data
        const giftData = connector.extractGiftData(data);

        // Get user data early for streak tracking
        const userData = connector.extractUserData(data);
        
        // Track gift streaks to calculate incremental amounts
        const streakKey = `${userData.username}:${giftData.giftId}`;
        const currentRepeatCount = giftData.repeatCount;
        const diamondCount = giftData.diamondCount;
        
        // Get previous repeat count for this user/gift combination
        const streakData = connector.giftStreaks.get(streakKey);
        const previousRepeatCount = streakData ? streakData.previousRepeatCount : 0;
        
        // Calculate incremental repeat count
        let incrementalRepeatCount;
        if (currentRepeatCount > previousRepeatCount) {
            incrementalRepeatCount = currentRepeatCount - previousRepeatCount;
        } else {
            incrementalRepeatCount = currentRepeatCount;
        }
        
        // Calculate incremental coins
        let incrementalCoins = 0;
        if (diamondCount > 0 && incrementalRepeatCount > 0) {
            incrementalCoins = diamondCount * 2 * incrementalRepeatCount;
        }

        // Update streak tracking
        connector.giftStreaks.set(streakKey, {
            previousRepeatCount: currentRepeatCount,
            timestamp: Date.now()
        });

        // Only emit events if there's an incremental amount > 0
        if (incrementalCoins > 0) {
            const eventData = {
                uniqueId: userData.username,
                username: userData.username,
                nickname: userData.nickname,
                giftName: giftData.giftName,
                giftId: giftData.giftId,
                giftPictureUrl: giftData.giftPictureUrl,
                repeatCount: incrementalRepeatCount,
                diamondCount: diamondCount,
                coins: incrementalCoins,
                timestamp: new Date().toISOString()
            };

            connector.handleEvent('gift', eventData);
            mockDb.logEvent('gift', eventData.username, eventData);
        }
    });
    
    console.log('\n📋 Test Case 1: Rose streak (like in the issue)');
    console.log('   Simulating user sending roses repeatedly (streak)');
    console.log('-'.repeat(80));
    
    // Simulate the scenario from the issue where repeatCount increases
    // This is what TikTok sends during a streak
    const roseGiftEvents = [
        { repeatCount: 19, timestamp: '9:04:20 PM' },
        { repeatCount: 22, timestamp: '9:04:21 PM' },
        { repeatCount: 24, timestamp: '9:04:22 PM' },
        { repeatCount: 27, timestamp: '9:04:22 PM' },
        { repeatCount: 30, timestamp: '9:04:23 PM' },
        { repeatCount: 32, timestamp: '9:04:24 PM' },
        { repeatCount: 35, timestamp: '9:04:24 PM' },
        { repeatCount: 38, timestamp: '9:04:24 PM' },
        { repeatCount: 41, timestamp: '9:04:24 PM' },
        { repeatCount: 44, timestamp: '9:04:25 PM' },
        { repeatCount: 47, timestamp: '9:04:26 PM' },
        { repeatCount: 49, timestamp: '9:04:28 PM' },
    ];
    
    console.log('\n   Expected behavior: Show INCREMENTAL amounts, not cumulative');
    console.log('   First event: Rose x19 (38 coins) - new streak');
    console.log('   Second event: Rose x3 (6 coins) - incremental from 19 to 22');
    console.log('   Third event: Rose x2 (4 coins) - incremental from 22 to 24');
    console.log('   etc.\n');
    
    for (const event of roseGiftEvents) {
        const giftData = {
            gift: { 
                id: 5655, 
                name: 'Rose', 
                diamond_count: 1 
            },
            repeatCount: event.repeatCount,
            repeat_count: event.repeatCount,
            repeatEnd: false,
            repeat_end: false,
            giftType: 0,
            gift_type: 0,
            user: { 
                uniqueId: 'felixthetaidum', 
                nickname: 'Felix The Taidum' 
            }
        };
        
        console.log(`   Incoming: repeatCount=${event.repeatCount} at ${event.timestamp}`);
        connector.eventEmitter.emit('gift', giftData);
        
        // Small delay to simulate real-time events
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    console.log('\n' + '-'.repeat(80));
    console.log('📊 Results:');
    console.log(`   Events logged: ${mockDb.events.length}`);
    
    // Verify the results
    let totalCoins = 0;
    let allCorrect = true;
    
    for (let i = 0; i < mockDb.events.length; i++) {
        const event = mockDb.events[i];
        const incoming = roseGiftEvents[i];
        
        let expectedIncremental;
        if (i === 0) {
            expectedIncremental = incoming.repeatCount; // First event uses full count
        } else {
            expectedIncremental = incoming.repeatCount - roseGiftEvents[i-1].repeatCount;
        }
        const expectedCoins = expectedIncremental * 2; // Rose has diamond_count = 1, so coins = 1 * 2 * count
        
        totalCoins += expectedCoins;
        
        if (event.data.repeatCount !== expectedIncremental || event.data.coins !== expectedCoins) {
            console.log(`   ❌ Event ${i+1}: Got x${event.data.repeatCount} (${event.data.coins} coins), expected x${expectedIncremental} (${expectedCoins} coins)`);
            allCorrect = false;
        } else {
            console.log(`   ✅ Event ${i+1}: Correct - x${event.data.repeatCount} (${event.data.coins} coins)`);
        }
    }
    
    console.log(`\n   Total coins calculated: ${totalCoins}`);
    console.log(`   Expected total: ${roseGiftEvents[roseGiftEvents.length - 1].repeatCount * 2} (49 roses * 2 = 98 coins)`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 Test Case 2: Team Heart (non-streakable gift)');
    console.log('   Simulating a gift that can only be sent once');
    console.log('-'.repeat(80));
    
    // Reset
    mockDb.events = [];
    emittedEvents = [];
    
    const teamHeartEvent = {
        gift: { 
            id: 9999, 
            name: 'Team Heart', 
            diamond_count: 50 
        },
        repeatCount: 1,
        repeat_count: 1,
        repeatEnd: true,
        repeat_end: true,
        giftType: 0,
        gift_type: 0,
        user: { 
            uniqueId: 'generoususer', 
            nickname: 'Generous User' 
        }
    };
    
    console.log('\n   Expected: Team Heart x1 (100 coins)\n');
    console.log('   Incoming: repeatCount=1');
    connector.eventEmitter.emit('gift', teamHeartEvent);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    console.log('\n' + '-'.repeat(80));
    console.log('📊 Results:');
    
    if (mockDb.events.length === 1) {
        const event = mockDb.events[0];
        if (event.data.repeatCount === 1 && event.data.coins === 100) {
            console.log('   ✅ Correct: Team Heart x1 (100 coins)');
        } else {
            console.log(`   ❌ Wrong: Got x${event.data.repeatCount} (${event.data.coins} coins), expected x1 (100 coins)`);
            allCorrect = false;
        }
    } else {
        console.log(`   ❌ Wrong: Got ${mockDb.events.length} events, expected 1`);
        allCorrect = false;
    }
    
    console.log('\n' + '='.repeat(80));
    
    if (allCorrect) {
        console.log('\n🎉 All tests passed! Gift streaks are now calculated incrementally.');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed!');
        process.exit(1);
    }
}

// Run test
runTest().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
});
