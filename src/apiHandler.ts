import { requestUrl } from "obsidian";
import { PrayerTimesSettings } from "./settings";

// Template presets
const TEMPLATE_PRESETS: Record<string, Record<string, string>> = {
    table: {
        regular: "**Location:** %city%\n**Date:** %MMMM% %DD%, %YYYY%\n\n| Prayer | Time | Time (UTC) |\n|--------|------|-------------|\n| Fajr | %fajr% | %fajr_utc% |\n| Sunrise | %sunrise% | %sunrise_utc% |\n| Dhuhr | %dhuhr% | %dhuhr_utc% |\n| Asr | %asr% | %asr_utc% |\n| Maghrib | %maghrib% | %maghrib_utc% |\n| Isha | %isha% | %isha_utc% |\n| Midnight | %midnight% | %midnight_utc% |",
        "24h": "**Location:** %city%\n**Date:** %MMMM% %DD%, %YYYY%\n\n| Prayer | Time | Time (UTC) |\n|--------|------|-------------|\n| Fajr | %fajr_24h% | %fajr_24h_utc% |\n| Sunrise | %sunrise_24h% | %sunrise_24h_utc% |\n| Dhuhr | %dhuhr_24h% | %dhuhr_24h_utc% |\n| Asr | %asr_24h% | %asr_24h_utc% |\n| Maghrib | %maghrib_24h% | %maghrib_24h_utc% |\n| Isha | %isha_24h% | %isha_24h_utc% |\n| Midnight | %midnight_24h% | %midnight_24h_utc% |",
    },
    checklist: {
        regular: "**Location:** %city%\n**Date:** %MMMM% %DD%, %YYYY%\n\n- [ ] Fajr: %fajr%\n- [ ] Sunrise: %sunrise%\n- [ ] Dhuhr: %dhuhr%\n- [ ] Asr: %asr%\n- [ ] Maghrib: %maghrib%\n- [ ] Isha: %isha%\n- [ ] Midnight: %midnight%",
        "24h": "**Location:** %city%\n**Date:** %MMMM% %DD%, %YYYY%\n\n- [ ] Fajr: %fajr_24h%\n- [ ] Sunrise: %sunrise_24h%\n- [ ] Dhuhr: %dhuhr_24h%\n- [ ] Asr: %asr_24h%\n- [ ] Maghrib: %maghrib_24h%\n- [ ] Isha: %isha_24h%\n- [ ] Midnight: %midnight_24h%",
    },
    simple: {
        regular: "**Location:** %city%\n**Date:** %MMMM% %DD%, %YYYY%\n\nFajr: %fajr%\nSunrise: %sunrise%\nDhuhr: %dhuhr%\nAsr: %asr%\nMaghrib: %maghrib%\nIsha: %isha%\nMidnight: %midnight%",
        "24h": "**Location:** %city%\n**Date:** %MMMM% %DD%, %YYYY%\n\nFajr: %fajr_24h%\nSunrise: %sunrise_24h%\nDhuhr: %dhuhr_24h%\nAsr: %asr_24h%\nMaghrib: %maghrib_24h%\nIsha: %isha_24h%\nMidnight: %midnight_24h%",
    },
};

export async function fetchPrayerTimes(settings: PrayerTimesSettings): Promise<string> {
    const {
        city,
        includePrayerNames,
        includeUtcTime,
        utcOffset,
        selectedPreset,
        template,
        use24HourFormat,
        showDate,
        showLocation,
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
    
    // Get all available prayer times
    const allPrayerTimes = data.data.timings;
    
    // Create a map of all placeholder values
    const placeholders = new Map();
    
    // Add date placeholders (replacing %date% with individual components)
    placeholders.set('%DD%', day.toString().padStart(2, '0'));
    placeholders.set('%D%', day.toString());
    placeholders.set('%MM%', month.toString().padStart(2, '0'));
    placeholders.set('%M%', month.toString());
    placeholders.set('%YYYY%', year.toString());
    placeholders.set('%YY%', year.toString().slice(-2));
    placeholders.set('%MMMM%', monthName);
    placeholders.set('%MMM%', date.toLocaleString('default', { month: 'short' }));
    placeholders.set('%dddd%', dayName);
    placeholders.set('%ddd%', date.toLocaleString('default', { weekday: 'short' }));
    
    // For backward compatibility
    placeholders.set('%date%', `${monthName} ${day}, ${year}`);
    placeholders.set('%city%', city);
    
    // Add prayer-specific placeholders
    Object.entries(allPrayerTimes).forEach(([prayer, time]) => {
        const prayerKey = prayer.toLowerCase();
        const timeObj = new Date(`${rawDate} ${time}`);
        
        // Store both 12h and 24h formats
        placeholders.set(`%${prayerKey}%`, formatTime(timeObj, false));
        placeholders.set(`%${prayerKey}_24h%`, formatTime(timeObj, true));
        
        if (includeUtcTime) {
            const utcTimeObj = new Date(timeObj.getTime() - utcOffset * 60 * 60 * 1000);
            placeholders.set(`%${prayerKey}_utc%`, formatTime(utcTimeObj, false));
            placeholders.set(`%${prayerKey}_24h_utc%`, formatTime(utcTimeObj, true));
        } else {
            // If UTC time is disabled, provide empty values
            placeholders.set(`%${prayerKey}_utc%`, '');
            placeholders.set(`%${prayerKey}_24h_utc%`, '');
        }
    });
    
    // Determine which template to use
    let templateToUse = selectedPreset === "custom" 
        ? template 
        : getPresetTemplate(selectedPreset, use24HourFormat, includeUtcTime, showDate, showLocation);
    
    // Filter to only include selected prayers if using custom template
    if (selectedPreset === "custom") {
        // Custom logic for filtering prayers in custom templates would go here if needed
    }
    
    // Apply all placeholders to the template
    let content = templateToUse;
    for (const [key, value] of placeholders.entries()) {
        const regex = new RegExp(key.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g');
        content = content.replace(regex, value);
    }
    
    return content;
}

// Helper function to get the appropriate preset template
function getPresetTemplate(preset: string, use24HourFormat: boolean, includeUtc: boolean, showDate: boolean, showLocation: boolean): string {
    const formatKey = use24HourFormat ? "24h" : "regular";
    
    // Use default preset if the requested one doesn't exist
    const presetObj = TEMPLATE_PRESETS[preset] || TEMPLATE_PRESETS["table"];
    
    // Get the specific format template
    let template = presetObj[formatKey] || presetObj["regular"];
    
    // Apply formatting options
    if (!includeUtc) {
        // For table format, remove the UTC column
        if (preset === "table") {
            template = template
                .replace(/\| Time \| Time \(UTC\) \|/g, "| Time |")
                .replace(/\|------\|-------------\|/g, "|------|")
                .replace(/ \| %\w+_(?:24h_)?utc% \|/g, " |");
        }
        
        // For other formats, no special handling needed as placeholders will be replaced with empty strings
    }
    
    // Remove location line if not showing location
    if (!showLocation) {
        template = template.replace(/\*\*Location:\*\* %city%\n/g, "");
    }
    
    // Remove date line if not showing date
    if (!showDate) {
        template = template.replace(/\*\*Date:\*\* %MMMM% %DD%, %YYYY%\n/g, "");
    }
    
    return template;
}

// Helper function to format time
function formatTime(date: Date, use24h: boolean): string {
    return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: !use24h,
    });
}
