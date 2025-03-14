import { requestUrl } from "obsidian";
import { PrayerTimesSettings } from "./settings";

export async function fetchPrayerTimes(settings: PrayerTimesSettings): Promise<string> {
    const {
        city,
        prayersToInclude,
        includeUtcTime,
        utcOffset,
        template,
        prayerTemplate,
    } = settings;

    const apiUrl = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=&method=2`;
    const response = await requestUrl({ url: apiUrl });
    if (response.status !== 200) throw new Error(`API request failed with status ${response.status}`);

    const data = response.json; 
    if (!data || !data.data || !data.data.date) throw new Error("Invalid data received from API");

    const rawDate = data.data.date.readable;
    const date = new Date(`${rawDate} ${data.data.timings.Fajr}`); // Using Fajr time to get a complete date object
    
    // Extract date parts for placeholders
    const day = date.getDate();
    const month = date.getMonth() + 1; // 0-indexed
    const year = date.getFullYear();
    const monthName = date.toLocaleString('default', { month: 'long' });
    const dayName = date.toLocaleString('default', { weekday: 'long' });
    
    // Format date for the placeholder
    const formattedDate = `${monthName} ${day}, ${year}`;
    
    // Get all available prayer times
    const allPrayerTimes = data.data.timings;
    
    // Filter prayers based on user selection
    const filteredPrayerTimes = Object.entries(allPrayerTimes).filter(([key]) =>
        prayersToInclude.includes(key)
    );

    // Create prayer-specific times map for prayer placeholders
    const prayerMap = new Map();
    Object.entries(allPrayerTimes).forEach(([prayer, time]) => {
        const prayerKey = prayer.toLowerCase();
        const timeObj = new Date(`${rawDate} ${time}`);
        
        // Store both 12h and 24h formats with consistent % notation
        prayerMap.set(`%${prayerKey}%`, formatTime(timeObj, false));
        prayerMap.set(`%${prayerKey}_24h%`, formatTime(timeObj, true));
        
        if (includeUtcTime) {
            const utcTimeObj = new Date(timeObj.getTime() - utcOffset * 60 * 60 * 1000);
            prayerMap.set(`%${prayerKey}_utc%`, formatTime(utcTimeObj, false));
            prayerMap.set(`%${prayerKey}_24h_utc%`, formatTime(utcTimeObj, true));
        }
    });

    // Generate prayer entries using the template
    const prayerEntries = filteredPrayerTimes.map(([prayer, time]) => {
        const localTime = `${rawDate} ${time}`;
        const localDate = new Date(localTime);
        
        // Format times
        const time12h = formatTime(localDate, false);
        const time24h = formatTime(localDate, true);
        
        // Calculate UTC time
        let utcTime = '';
        let utcTime24h = '';
        if (includeUtcTime) {
            const utcDate = new Date(localDate.getTime() - utcOffset * 60 * 60 * 1000);
            utcTime = formatTime(utcDate, false);
            utcTime24h = formatTime(utcDate, true);
        }
        
        // Replace placeholders in prayer template
        let entry = prayerTemplate;
        
        // Basic replacements
        entry = entry.replace(/%prayer%/g, prayer);
        entry = entry.replace(/%time%/g, time12h);
        entry = entry.replace(/%24h_time%/g, time24h);
        entry = entry.replace(/%utc_time%/g, utcTime);
        entry = entry.replace(/%24h_utc_time%/g, utcTime24h); // More consistent naming
        
        // Replace prayer-specific placeholders
        for (const [key, value] of prayerMap.entries()) {
            entry = entry.replace(new RegExp(key.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g'), value);
        }
        
        return entry;
    }).join('\n');

    // Replace placeholders in main template
    let content = template;
    
    // Basic replacements
    content = content.replace(/%date%/g, formattedDate);
    content = content.replace(/%city%/g, city);
    content = content.replace(/%prayers%/g, prayerEntries);
    
    // Date parts
    content = content.replace(/%dd%/g, day.toString().padStart(2, '0'));
    content = content.replace(/%mm%/g, month.toString().padStart(2, '0'));
    content = content.replace(/%yyyy%/g, year.toString());
    content = content.replace(/%month%/g, monthName);
    content = content.replace(/%day%/g, dayName);
    
    // UTC table parts
    if (includeUtcTime) {
        content = content.replace(/%utc_header%/g, 'Time (UTC)');
        content = content.replace(/%utc_divider%/g, '----------');
    } else {
        content = content.replace(/%utc_header%/g, '');
        content = content.replace(/%utc_divider%/g, '');
    }
    
    // Replace prayer-specific placeholders in the main template as well
    for (const [key, value] of prayerMap.entries()) {
        content = content.replace(new RegExp(key.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g'), value);
    }

    return content;
}

// Helper function to format time
function formatTime(date: Date, use24h: boolean): string {
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: !use24h,
    });
}
