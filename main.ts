import { Plugin, PluginSettingTab, Setting, Notice } from "obsidian";

interface PrayerTimesSettings {
    timeFormat24h: boolean;
    prayersToInclude: string[];
    includeDate: boolean;
    includeLocation: boolean;
    dateFormat: string;
    fetchOnLaunch: boolean;
    fetchOnNoteOpen: boolean; // New setting
}

const DEFAULT_SETTINGS: PrayerTimesSettings = {
    timeFormat24h: true,
    prayersToInclude: ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha", "Midnight"],
    includeDate: true,
    includeLocation: true,
    dateFormat: "MM/DD/YYYY",
    fetchOnLaunch: false,
    fetchOnNoteOpen: false, // Default to disabled
};

export default class PrayerTimesPlugin extends Plugin {
    settings: PrayerTimesSettings;

    async onload() {
        console.log("Loading Prayer Times Plugin");

        // Load settings
        await this.loadSettings();

        // Add settings tab
        this.addSettingTab(new PrayerTimesSettingTab(this.app, this));

        // Automatically fetch prayer times on startup if enabled
        if (this.settings.fetchOnLaunch) {
            this.registerEvent(this.app.workspace.on("layout-ready", async () => {
                await this.fetchAndSavePrayerTimes();
            }));
        }

        // Fetch prayer times when the "Prayer Times" note is opened, if enabled
        if (this.settings.fetchOnNoteOpen) {
            this.registerEvent(
                this.app.workspace.on("file-open", async (file) => {
                    if (file && file.name === "Prayer Times.md") {
                        await this.fetchAndSavePrayerTimes();
                    }
                })
            );
        }

        // Add manual command
        this.addCommand({
            id: "fetch-prayer-times",
            name: "Fetch Prayer Times",
            callback: async () => {
                await this.fetchAndSavePrayerTimes();
            },
        });
    }

    async fetchAndSavePrayerTimes() {
        const { prayersToInclude, includeDate, includeLocation, dateFormat, timeFormat24h } = this.settings;

        const city = "New York";
        const country = "USA";

        const apiUrl = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=2`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();
            if (!data || !data.data || !data.data.date) {
                throw new Error("Invalid data received from API");
            }

            const rawDate = data.data.date.readable;
            const formattedDate = window.moment(rawDate, "DD MMM YYYY").format(dateFormat);

            const filteredPrayerTimes = Object.entries(data.data.timings).filter(([key]) =>
                prayersToInclude.includes(key)
            );

            const formattedPrayerTimes = filteredPrayerTimes
                .map(([prayer, time]) => {
                    const localTime = `${rawDate} ${time}`;
                    const localDate = new Date(localTime);
                    const etFormattedTime = localDate.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: !timeFormat24h,
                    });

                    const fiveHoursLater = new Date(localDate.getTime() + 5 * 60 * 60 * 1000);
                    const fiveHoursLaterFormatted = fiveHoursLater.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: !timeFormat24h,
                    });

                    return `| ${prayer.padEnd(12)} | ${etFormattedTime.padEnd(8)} | ${fiveHoursLaterFormatted.padEnd(8)} |`;
                })
                .join("\n");

            let content = "";
            if (includeDate) content += `**Date:** ${formattedDate}\n`;
            if (includeLocation) content += `**Location:** ${city}\n\n`;
            content += "| Prayer       | Time       | Time (UTC) |\n";
            content += "|--------------|------------|------------|\n";
            content += `${formattedPrayerTimes}\n`;

            const filePath = "Prayer Times.md";
            const vault = this.app.vault;
            const existingFile = vault.getAbstractFileByPath(filePath);

            if (existingFile) {
                await vault.modify(existingFile, content);
            } else {
                await vault.create(filePath, content);
            }

            new Notice("Prayer times updated successfully!");
        } catch (error) {
            console.error("Failed to fetch prayer times:", error);
            new Notice("Failed to fetch prayer times. Check the console for details.");
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    onunload() {
        console.log("Unloading Prayer Times Plugin");
    }
}

class PrayerTimesSettingTab extends PluginSettingTab {
    plugin: PrayerTimesPlugin;

    constructor(app: any, plugin: PrayerTimesPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName("Fetch on app launch")
            .setDesc("Automatically fetch prayer times when the app is launched?")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.fetchOnLaunch).onChange(async (value) => {
                    this.plugin.settings.fetchOnLaunch = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName("Fetch on note open")
            .setDesc("Automatically fetch prayer times when 'Prayer Times.md' is opened?")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.fetchOnNoteOpen).onChange(async (value) => {
                    this.plugin.settings.fetchOnNoteOpen = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName("24-hour time format")
            .setDesc("Display times in 24-hour format?")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.timeFormat24h).onChange(async (value) => {
                    this.plugin.settings.timeFormat24h = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName("Prayers to include")
            .setDesc("Valid options: Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha, Midnight")
            .addTextArea((textArea) =>
                textArea
                    .setPlaceholder("e.g., Fajr, Dhuhr, Asr")
                    .setValue(this.plugin.settings.prayersToInclude.join(", "))
                    .onChange(async (value) => {
                        this.plugin.settings.prayersToInclude = value.split(",").map((prayer) => prayer.trim());
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Include date")
            .setDesc("Include the date in the file?")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.includeDate).onChange(async (value) => {
                    this.plugin.settings.includeDate = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName("Include location")
            .setDesc("Include the location in the file?")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.includeLocation).onChange(async (value) => {
                    this.plugin.settings.includeLocation = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName("Date format")
            .setDesc("Choose the date format")
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions({
                        "MM/DD/YYYY": "11/23/2024",
                        "DD MMM YYYY": "23 Nov 2024",
                        "YYYY-MM-DD": "2024-11-23",
                    })
                    .setValue(this.plugin.settings.dateFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.dateFormat = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
