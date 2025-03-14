import { PluginSettingTab, Setting, ButtonComponent, setIcon } from "obsidian";
import PrayerTimesPlugin from "./prayerTimesPlugin";
import { DEFAULT_SETTINGS } from "./settings";

export default class PrayerTimesSettingTab extends PluginSettingTab {
    plugin: PrayerTimesPlugin;

    constructor(app: any, plugin: PrayerTimesPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Add custom CSS for spinning arrow
        const style = document.createElement('style');
        style.textContent = `
            .reset-arrow-button {
                color: var(--text-error) !important;
                padding: 0 !important;
                margin-left: 8px !important;
            }
            .reset-arrow-button:hover svg {
                animation: spin 1s linear;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        containerEl.appendChild(style);

        // General settings (no heading)
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
            .setDesc("Enter your city.")
            .addText((text) =>
                text
                    .setPlaceholder("e.g., New York")
                    .setValue(this.plugin.settings.city)
                    .onChange(async (value) => {
                        this.plugin.settings.city = value.trim();
                        await this.plugin.saveSettings();
                    })
            );

        // Update Frequency
        new Setting(containerEl)
            .setHeading()
            .setName("Update Frequency");

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
            .setDesc("Automatically fetch prayer times when the appropriate note is opened?")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.fetchOnNoteOpen).onChange(async (value) => {
                    this.plugin.settings.fetchOnNoteOpen = value;
                    await this.plugin.saveSettings();
                })
            );

        // UTC settings
        new Setting(containerEl)
            .setHeading()
            .setName("UTC Settings");

        new Setting(containerEl)
            .setName("Include UTC Time")
            .setDesc("Make UTC time placeholders available.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.includeUtcTime)
                    .onChange(async (value) => {
                        this.plugin.settings.includeUtcTime = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("UTC Offset")
            .setDesc("Specify the UTC offset to calculate UTC time.")
            .addDropdown((dropdown) => {
                for (let i = -12; i <= 14; i++) {
                    const offsetString = i >= 0 ? `+${i}` : `${i}`;
                    dropdown.addOption(i.toString(), `UTC${offsetString}`);
                }
                dropdown.setValue(this.plugin.settings.utcOffset.toString())
                    .onChange(async (value) => {
                        this.plugin.settings.utcOffset = parseInt(value);
                        await this.plugin.saveSettings();
                    });
            });
            
        // Output Configuration
        new Setting(containerEl)
            .setHeading()
            .setName("Output Configuration");

        new Setting(containerEl)
            .setName("Output Location")
            .setDesc("Choose where to store prayer times")
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions({
                        "dedicated": "Dedicated 'Prayer Times.md' file",
                        "daily": "Daily Note"
                    })
                    .setValue(this.plugin.settings.outputLocation)
                    .onChange(async (value) => {
                        this.plugin.settings.outputLocation = value;
                        await this.plugin.saveSettings();
                    })
            );

        // Only show these settings if daily note is selected
        if (this.plugin.settings.outputLocation === "daily") {
            new Setting(containerEl)
                .setName("Daily Note Format")
                .setDesc("Format for daily note filenames (e.g., YYYY-MM-DD)")
                .addText((text) =>
                    text
                        .setPlaceholder("YYYY-MM-DD")
                        .setValue(this.plugin.settings.dailyNoteFormat)
                        .onChange(async (value) => {
                            this.plugin.settings.dailyNoteFormat = value;
                            await this.plugin.saveSettings();
                        })
                );

            new Setting(containerEl)
                .setName("Auto-create Daily Note")
                .setDesc("Automatically create daily note if it doesn't exist?")
                .addToggle((toggle) =>
                    toggle
                        .setValue(this.plugin.settings.autoCreateDailyNote)
                        .onChange(async (value) => {
                            this.plugin.settings.autoCreateDailyNote = value;
                            await this.plugin.saveSettings();
                        })
                );
                
            new Setting(containerEl)
                .setName("Section Heading")
                .setDesc("Heading to use for the prayer times section in daily notes")
                .addText((text) =>
                    text
                        .setPlaceholder("Prayer Times")
                        .setValue(this.plugin.settings.sectionHeading)
                        .onChange(async (value) => {
                            this.plugin.settings.sectionHeading = value;
                            await this.plugin.saveSettings();
                        })
                );
                
            new Setting(containerEl)
                .setName("Daily Note Template")
                .setDesc("Template to use for daily notes. Use %prayers% placeholder for prayer times.")
                .addTextArea((text) =>
                    text
                        .setPlaceholder("%prayers%")
                        .setValue(this.plugin.settings.dailyTemplate)
                        .onChange(async (value) => {
                            this.plugin.settings.dailyTemplate = value;
                            await this.plugin.saveSettings();
                        })
                )
                .addButton((button: ButtonComponent) => {
                    button
                        .setTooltip("Reset to default template")
                        .setClass("reset-arrow-button")
                        .onClick(async () => {
                            this.plugin.settings.dailyTemplate = DEFAULT_SETTINGS.dailyTemplate;
                            await this.plugin.saveSettings();
                            this.display();
                        });
                    
                    // Set arrow-reset icon
                    setIcon(button.buttonEl, "reset");
                });
        }

        // Template Settings
        new Setting(containerEl)
            .setHeading()
            .setName("Template Settings");
            
        new Setting(containerEl)
            .setName("Main Template")
            .setDesc("Template for the entire output. Use placeholders to customize the format.")
            .addTextArea((text) =>
                text
                    .setPlaceholder("**Date:** %date%\n**Location:** %city%\n\n| Prayer | Time | %utc_header% |\n|--------|------|%utc_divider%|\n%prayers%")
                    .setValue(this.plugin.settings.template)
                    .onChange(async (value) => {
                        this.plugin.settings.template = value;
                        await this.plugin.saveSettings();
                    })
                )
                .addButton((button: ButtonComponent) => {
                    button
                        .setTooltip("Reset to default template")
                        .setClass("reset-arrow-button")
                        .onClick(async () => {
                            this.plugin.settings.template = DEFAULT_SETTINGS.template;
                            await this.plugin.saveSettings();
                            this.display();
                        });
                    
                    // Set arrow-reset icon
                    setIcon(button.buttonEl, "reset");
                });
            
        new Setting(containerEl)
            .setName("Prayer Template")
            .setDesc("Template for each prayer entry. This determines how each individual prayer is formatted.")
            .addTextArea((text) =>
                text
                    .setPlaceholder("| %prayer% | %time% | %utc_time% |")
                    .setValue(this.plugin.settings.prayerTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.prayerTemplate = value;
                        await this.plugin.saveSettings();
                    })
                )
                .addButton((button: ButtonComponent) => {
                    button
                        .setTooltip("Reset to default template")
                        .setClass("reset-arrow-button")
                        .onClick(async () => {
                            this.plugin.settings.prayerTemplate = DEFAULT_SETTINGS.prayerTemplate;
                            await this.plugin.saveSettings();
                            this.display();
                        });
                    
                    // Set arrow-reset icon
                    setIcon(button.buttonEl, "reset");
                });
            
        // Detailed placeholder help
        new Setting(containerEl)
            .setName("Template Help")
            .setDesc("Available placeholders to use in your templates");

        // General placeholders explanation
        new Setting(containerEl)
            .setName("General Placeholders")
            .setDesc(`
%date% - Full formatted date (e.g., "January 15, 2024")
%city% - Your configured city name
%prayers% - All prayer entries (in Main Template only)
            `);

        // Time placeholders explanation
        new Setting(containerEl)
            .setName("Time Format Placeholders")
            .setDesc(`
%time% - Standard 12-hour time (e.g., "5:23 AM")
%24h_time% - 24-hour time format (e.g., "05:23")
%utc_time% - UTC time in 12-hour format
%24h_utc_time% - UTC time in 24-hour format
            `);

        // Date placeholders explanation  
        new Setting(containerEl)
            .setName("Date Part Placeholders")
            .setDesc(`
%dd% - Day of month (01-31)
%mm% - Month number (01-12)
%yyyy% - Full year (e.g., 2024)
%month% - Month name (e.g., "January")
%day% - Day of week (e.g., "Monday")
            `);

        // UTC and prayer-specific placeholders  
        new Setting(containerEl)
            .setName("Special Placeholders")
            .setDesc(`
%utc_header%, %utc_divider% - For formatting table headers with UTC column

Prayer-specific: %fajr%, %dhuhr%, %asr%, %maghrib%, %isha%, %sunrise%, %midnight%, etc.
For 24-hour format: %fajr_24h%, %dhuhr_24h%, etc.
For UTC: %fajr_utc%, %dhuhr_utc%, etc.
For 24-hour UTC: %fajr_24h_utc%, %dhuhr_24h_utc%, etc.
            `);
            
        // Example Templates
        new Setting(containerEl)
            .setName("Example Templates")
            .setDesc(`
Checkbox Format (Prayer Template):
- [ ] %prayer%: %time%

Daily Prayer To-Do List (Main Template):
## Prayer Tasks for %date%
%prayers%

For Specific Prayer Times:
Fajr: %fajr%
Dhuhr: %dhuhr%
            `);
            
        // Add reset to default button
        new Setting(containerEl)
            .setHeading()
            .setName("Reset Settings");
            
        new Setting(containerEl)
            .setName("Reset to Default")
            .setDesc("Reset all settings to their default values")
            .addButton((button: ButtonComponent) => {
                button
                    .setButtonText("Reset All Settings")
                    .setCta()
                    .onClick(async () => {
                        // Ask for confirmation
                        if (confirm("Are you sure you want to reset all settings to their default values?")) {
                            await this.plugin.resetSettings();
                            // Refresh the settings tab
                            this.display();
                        }
                    });
            });
    }
}
