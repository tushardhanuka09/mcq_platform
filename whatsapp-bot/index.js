require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');

// 1. Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// 2. Initialize WhatsApp
console.log('Initializing WhatsApp Client...');
const client = new Client({
    authStrategy: new LocalAuth(), // Saves login session so you don't scan QR every time
    puppeteer: { headless: true }
});

client.on('qr', (qr) => {
    console.log('\n==================================================');
    console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP APP');
    console.log('==================================================\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ WHATSAPP IS CONNECTED AND READY!');
    console.log('Listening to the Live Supabase Cloud for new Test Scores...\n');
    startPolling();
});

client.initialize();

// 3. Polling Logic (Checks Supabase every 10 seconds for new tests)
let lastCheckedAt = new Date().toISOString();

async function startPolling() {
    setInterval(async () => {
        try {
            // Fetch any test attempts that happened AFTER our last check
            const { data: newAttempts, error } = await supabase
                .from('test_attempts')
                .select(`
                    id,
                    score,
                    total_questions,
                    completed_at,
                    test_id,
                    profiles ( full_name, parent_mobile ),
                    tests ( id, title )
                `)
                .eq('is_late', false)
                .gt('completed_at', lastCheckedAt)
                .order('completed_at', { ascending: true });

            if (error) {
                console.error('Supabase Error:', error.message);
                return;
            }

            if (newAttempts && newAttempts.length > 0) {
                console.log(`Found ${newAttempts.length} new test scores! Sending WhatsApps...`);
                
                // Update the last checked timestamp to the latest one we just pulled
                lastCheckedAt = new Date().toISOString(); // Slightly imperfect, but safe for low volume

                for (const attempt of newAttempts) {
                    const studentName = attempt.profiles.full_name;
                    const parentMobile = attempt.profiles.parent_mobile;
                    const testName = attempt.tests.title;
                    const score = attempt.score;
                    const total = attempt.total_questions;

                    if (!parentMobile) continue;

                    // Calculate live rank for this specific test
                    const { count } = await supabase
                        .from('test_attempts')
                        .select('*', { count: 'exact', head: true })
                        .eq('test_id', attempt.tests.id || attempt.id) // Fallback if join is missing id
                        .gt('score', score);
                        
                    const rank = (count || 0) + 1;

                    // Format mobile number for WhatsApp (adding country code if missing)
                    let formattedNumber = parentMobile.replace(/\D/g, ''); // Remove non-digits
                    if (formattedNumber.length === 10) formattedNumber = `91${formattedNumber}`;
                    const chatId = `${formattedNumber}@c.us`;

                    const message = `🎓 *Sumitian Portal Update*\n\nHello! This is an automated update. Your child, *${studentName}*, has just completed the *${testName}* test.\n\n🏆 *Score:* ${score} out of ${total}\n📊 *Test Rank:* #${rank}\n\nGreat job! Check the live leaderboard on the portal for full class standings.`;

                    try {
                        await client.sendMessage(chatId, message);
                        console.log(`✅ Sent scorecard to ${studentName}'s parent (${formattedNumber})`);
                    } catch (waError) {
                        console.error(`❌ Failed to send to ${formattedNumber}:`, waError.message);
                    }
                }
            }
        } catch (err) {
            console.error('Polling error:', err);
        }
        
        try {
            // Check for tests that just expired
            const nowIso = new Date().toISOString();
            const { data: expiredTests } = await supabase
                .from('tests')
                .select('id, title, chapter_id, chapters ( class_level )')
                .lt('expires_at', nowIso)
                .eq('expiry_notified', false);
                
            if (expiredTests && expiredTests.length > 0) {
                for (const test of expiredTests) {
                    console.log(`Test expired! Processing alerts for: ${test.title}`);
                    
                    // Mark as notified immediately to prevent duplicate processing
                    await supabase.from('tests').update({ expiry_notified: true }).eq('id', test.id);
                    
                    const classLevel = test.chapters.class_level;
                    
                    // Get all students in this class
                    const { data: students } = await supabase
                        .from('profiles')
                        .select('id, full_name, parent_mobile')
                        .eq('role', 'student')
                        .eq('class_level', classLevel);
                        
                    // Get all attempts for this test
                    const { data: attempts } = await supabase
                        .from('test_attempts')
                        .select('user_id')
                        .eq('test_id', test.id);
                        
                    const attemptUserIds = attempts.map(a => a.user_id);
                    
                    for (const student of students) {
                        if (!attemptUserIds.includes(student.id) && student.parent_mobile) {
                            // Student missed it!
                            let formattedNumber = student.parent_mobile.replace(/\D/g, '');
                            if (formattedNumber.length === 10) formattedNumber = `91${formattedNumber}`;
                            const chatId = `${formattedNumber}@c.us`;

                            const message = `🚨 *Sumitian Urgent Alert*\n\nDear Parent, your child *${student.full_name}* did NOT complete the mandatory test *${test.title}* before the deadline.\n\nStrict action will be taken. Please ensure they remain attentive to class schedules.`;

                            try {
                                await client.sendMessage(chatId, message);
                                console.log(`✅ Sent missed-test alert to ${student.full_name}'s parent`);
                            } catch (waError) {
                                console.error(`❌ Failed alert:`, waError.message);
                            }
                        }
                    }
                }
            }
        } catch (expErr) {
            console.error('Expiry polling error:', expErr);
        }
    }, 10000); // 10,000 ms = 10 seconds
}
