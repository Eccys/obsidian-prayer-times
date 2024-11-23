import { Plugin, PluginSettingTab, Setting, Notice } from "obsidian";

interface PrayerTimesSettings {
    timeFormat24h: boolean;
    prayersToInclude: string[];
    includeDate: boolean;
    includeLocation: boolean;
    dateFormat: string;
}

const DEFAULT_SETTINGS: PrayerTimesSettings = {
    timeFormat24h: true,
    prayersToInclude: ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha", "Midnight"],
    includeDate: true,
    includeLocation: true,
    dateFormat: "MM/DD/YYYY", // Default to "11/23/2024"
};

export default class PrayerTimesPlugin extends Plugin {
    settings: PrayerTimesSettings;

    async onload() {
        console.log("Loading Prayer Times Plugin");

        // Load settings
        await this.loadSettings();

        // Add settings tab
        this.addSettingTab(new PrayerTimesSettingTab(this.app, this));

        // Automatically fetch prayer times on startup
        this.registerEvent(this.app.workspace.on("layout-ready", async () => {
            await this.fetchAndSavePrayerTimes();
        }));

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

        // City is fixed as "New York"
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

            // Filter prayers
            const filteredPrayerTimes = Object.entries(data.data.timings).filter(([key]) =>
                prayersToInclude.includes(key)
            );

            // Format prayer times
            const formattedPrayerTimes = filteredPrayerTimes
                .map(([prayer, time]) => {
                    const localTime = `${rawDate} ${time}`; // Local time (as received)
                    const localDate = new Date(localTime);  // Create Date object for NYC local time

                    // Convert local time to UTC by adding the timezone offset
                    const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000); // UTC time

                    // Format the times for the second column (ET)
                    const etFormattedTime = localDate.toLocaleTimeString("en-US", {
                        hour: "numeric", 
                        minute: "2-digit", 
                        hour12: !timeFormat24h, // User's time format preference (12/24 hour)
                    });

                    // For the third column, add 5 hours to the time in the second column
                    const fiveHoursLater = new Date(localDate.getTime() + 5 * 60 * 60 * 1000); // Add 5 hours
                    const fiveHoursLaterFormatted = fiveHoursLater.toLocaleTimeString("en-US", {
                        hour: "numeric", 
                        minute: "2-digit", 
                        hour12: !timeFormat24h, // User's time format preference (12/24 hour)
                    });

                    return `| ${prayer.padEnd(12)} | ${etFormattedTime.padEnd(8)} | ${fiveHoursLaterFormatted.padEnd(8)} |`;
                })
                .join("\n");

            // Format the final content
            let content = "";
            if (includeDate) content += `**Date:** ${formattedDate}\n`;
            if (includeLocation) content += `**Location:** ${city}\n\n`;
            content += "| Prayer       | Time | Time (UTC)|\n";
            content += "|--------------|----------|----------|\n";
            content += `${formattedPrayerTimes}\n`;

            // Save the file
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
        containerEl.createEl("h2", { text: "Prayer Times Plugin Settings" });

        new Setting(containerEl)
            .setName("24-Hour Time Format")
            .setDesc("Display times in 24-hour format?")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.timeFormat24h).onChange(async (value) => {
                    this.plugin.settings.timeFormat24h = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName("Prayers to Include")
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
            .setName("Include Date")
            .setDesc("Include the date in the file?")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.includeDate).onChange(async (value) => {
                    this.plugin.settings.includeDate = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName("Include Location")
            .setDesc("Include the location in the file?")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.includeLocation).onChange(async (value) => {
                    this.plugin.settings.includeLocation = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName("Date Format")
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
