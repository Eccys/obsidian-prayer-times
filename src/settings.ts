export interface PrayerTimesSettings {
    city: string;
    method: number;
    fetchOnLaunch: boolean;
    fetchOnNoteOpen: boolean;
    outputLocation: string;
    includePrayerNames: string[];
    includeUtcTime: boolean;
    utcOffset: number;
    
    // Template settings
    template: string;
    useCustomTemplate: boolean;
    selectedPreset: string;
    use24HourFormat: boolean;
    
    // Formatting options
    showDate: boolean;
    showLocation: boolean;
    
    // Prayer time offsets in minutes
    offsetFajr: number;
    offsetSunrise: number;
    offsetDhuhr: number;
    offsetAsr: number;
    offsetMaghrib: number;
    offsetIsha: number;
    offsetMidnight: number;
}

export const DEFAULT_SETTINGS: PrayerTimesSettings = {
    city: "London",
    method: 2,
    fetchOnLaunch: true,
    fetchOnNoteOpen: true,
    outputLocation: "Prayer Times.md",
    includePrayerNames: ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha", "Midnight"],
    includeUtcTime: false,
    utcOffset: 0,
    
    // Template defaults
    template: "**Date:** %MMMM% %DD%, %YYYY%\n**Location:** %city%\n\n| Prayer | Time |\n|--------|------|\n| Fajr | %fajr% |\n| Sunrise | %sunrise% |\n| Dhuhr | %dhuhr% |\n| Asr | %asr% |\n| Maghrib | %maghrib% |\n| Isha | %isha% |\n| Midnight | %midnight% |",
    useCustomTemplate: false,
    selectedPreset: "table",
    use24HourFormat: false,
    
    // Formatting defaults
    showDate: true,
    showLocation: true,
    
    // Default offsets (no offset)
    offsetFajr: 0,
    offsetSunrise: 0,
    offsetDhuhr: 0,
    offsetAsr: 0,
    offsetMaghrib: 0,
    offsetIsha: 0,
    offsetMidnight: 0,
};

