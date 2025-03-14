export interface PrayerTimesSettings {
    prayersToInclude: string[];
    city: string;
    includeUtcTime: boolean;
    utcOffset: number;
    // Location settings
    outputLocation: string; // 'dedicated' or 'daily'
    dailyNoteFormat: string; // Format string for daily note
    autoCreateDailyNote: boolean; // Whether to auto-create daily note if it doesn't exist
    sectionHeading: string; // Heading to use for the prayer times section
    // Template settings
    template: string; // General template for the entire output
    dailyTemplate: string; // Template used when in daily notes
    prayerTemplate: string; // Template for each prayer time entry
    fetchOnLaunch: boolean;
    fetchOnNoteOpen: boolean;
}

export const DEFAULT_SETTINGS: PrayerTimesSettings = {
    prayersToInclude: ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha", "Midnight"],
    city: "New York",
    includeUtcTime: false,
    utcOffset: 0,
    // Default values for location settings
    outputLocation: "dedicated",
    dailyNoteFormat: "YYYY-MM-DD",
    autoCreateDailyNote: true,
    sectionHeading: "Prayer Times",
    // Default templates
    template: "**Date:** %date%\n**Location:** %city%\n\n| Prayer | Time | %utc_header% |\n|--------|------|%utc_divider%|\n%prayers%",
    dailyTemplate: "%prayers%",
    prayerTemplate: "| %prayer% | %time% | %utc_time% |",
    fetchOnLaunch: false,
    fetchOnNoteOpen: false,
};

