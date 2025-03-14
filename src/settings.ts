export interface PrayerTimesSettings {
    city: string;
    method: number;
    fetchOnLaunch: boolean;
    fetchOnNoteOpen: boolean;
    outputLocation: string;
    includePrayerNames: string[];
    
    // Template and formatting settings
    selectedPreset: string; // Now includes "custom" as an option
    template: string; // Used when selectedPreset is "custom"
    use24HourFormat: boolean;
    showDate: boolean;
    showLocation: boolean;
    includeUtcTime: boolean;
    utcOffset: number;
    
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
    
    // Template and formatting defaults
    selectedPreset: "table",
    template: "**Location:** %city%\n**Date:** %MMMM% %DD%, %YYYY%\n\n| Prayer | Time |\n|--------|------|\n| Fajr | %fajr% |\n| Sunrise | %sunrise% |\n| Dhuhr | %dhuhr% |\n| Asr | %asr% |\n| Maghrib | %maghrib% |\n| Isha | %isha% |\n| Midnight | %midnight% |",
    use24HourFormat: false,
    showDate: true,
    showLocation: true,
    includeUtcTime: false,
    utcOffset: 0,
    
    // Default offsets (no offset)
    offsetFajr: 0,
    offsetSunrise: 0,
    offsetDhuhr: 0,
    offsetAsr: 0,
    offsetMaghrib: 0,
    offsetIsha: 0,
    offsetMidnight: 0,
};

