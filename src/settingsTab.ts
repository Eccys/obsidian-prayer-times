import { PluginSettingTab, Setting } from "obsidian";
import { PrayerTimesPlugin } from "./prayerTimesPlugin";

export default class PrayerTimesSettingTab extends PluginSettingTab {
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
            .setName("City")
            .setDesc("Enter your city")
            .addText((text) =>
                text
                    .setPlaceholder("e.g., New York")
                    .setValue(this.plugin.settings.city)
                    .onChange(async (value) => {
                        this.plugin.settings.city = value.trim();
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
