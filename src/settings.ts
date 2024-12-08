export interface PrayerTimesSettings {
    timeFormat24h: boolean;
    prayersToInclude: string[];
    includeDate: boolean;
    includeLocation: boolean;
    dateFormat: string;
    fetchOnLaunch: boolean;
    fetchOnNoteOpen: boolean;
    city: string;
    includeUtcTime: boolean;
	utcOffset: number;
}

export const DEFAULT_SETTINGS: PrayerTimesSettings = {
    timeFormat24h: true,
    prayersToInclude: ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha", "Midnight"],
    includeDate: true,
    includeLocation: true,
    dateFormat: "MM/DD/YYYY",
    fetchOnLaunch: false,
    fetchOnNoteOpen: false,
    city: "New York",
	includeUtcTime: false,
    utcOffset: 0,
};

