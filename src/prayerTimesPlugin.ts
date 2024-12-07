import { Plugin } from "obsidian";
import { PrayerTimesSettings, DEFAULT_SETTINGS } from "./settings";
import PrayerTimesSettingTab from "./settingsTab";
import { fetchPrayerTimes } from "./apiHandler";

export default class PrayerTimesPlugin extends Plugin {
    settings: PrayerTimesSettings;

    async onload() {
        console.log("Loading Prayer Times Plugin");
        await this.loadSettings();

        this.addSettingTab(new PrayerTimesSettingTab(this.app, this));

        if (this.settings.fetchOnLaunch) {
            this.registerEvent(this.app.workspace.on("layout-ready", async () => {
                await this.updatePrayerTimes();
            }));
        }

        if (this.settings.fetchOnNoteOpen) {
            this.registerEvent(
                this.app.workspace.on("file-open", async (file) => {
                    if (file && file.name === "Prayer Times.md") {
                        await this.updatePrayerTimes();
                    }
                })
            );
        }

        this.addCommand({
            id: "fetch-prayer-times",
            name: "Fetch Prayer Times",
            callback: async () => await this.updatePrayerTimes(),
        });
    }

    async updatePrayerTimes() {
        try {
            const content = await fetchPrayerTimes(this.settings);
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
}

