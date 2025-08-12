// lib/dummy-chat-data.ts

export const DUMMY_USERS = [
    { id: '1', name: 'Admin Ad', avatarUrl: null, initial: 'A' },
    { id: '2', name: 'Jane Doe', avatarUrl: '/avatars/jane.png', initial: 'J' },
    { id: '3', name: 'John Smith', avatarUrl: null, initial: 'JS' },
    { id: '4', name: 'Marketing Bot', avatarUrl: '/avatars/bot.png', initial: 'B' },
];

export const DUMMY_CHANNELS = [
    { id: '1', name: '📢 Admin Broadcasts', icon: 'Megaphone' },
    { id: '2', name: '🌍 General', icon: 'Globe' },
    { id: '3', name: '💻 SoftWare', icon: 'Code' },
    { id: '4', name: '🎨 Marketing', icon: 'Paintbrush' },
];

export const DUMMY_MESSAGES = [
    { id: 'm1', channelId: '1', userId: '1', text: 'Good morning everyone! Please remember the all-hands meeting is at 2 PM today.', timestamp: '10:30 AM' },
    { id: 'm2', channelId: '2', userId: '2', text: 'Hey team, does anyone have the latest sales report?', timestamp: '10:32 AM' },
    { id: 'm3', channelId: '2', userId: '3', text: 'I have it, I\'ll send it over in a minute.', timestamp: '10:33 AM' },
    { id: 'm4', channelId: '3', userId: '1', text: 'Quick reminder for the engineering team: we have a code freeze starting tomorrow for the new release.', timestamp: '11:00 AM' },
    { id: 'm5', channelId: '3', userId: '2', text: 'Got it, thanks for the heads up!', timestamp: '11:01 AM' },
    { id: 'm6', channelId: '4', userId: '4', text: 'New campaign "Summer Splash" is live! Check out the details in the shared drive.', timestamp: '11:15 AM' },
    { id: 'm7', channelId: '2', userId: '1', text: 'Also, a reminder that the office will be closed this Friday for the public holiday.', timestamp: '11:20 AM' },
];