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

        // Add custom CSS for template controls
        const style = document.createElement('style');
        style.textContent = `
            .template-container {
                position: relative;
                width: 100%;
            }
            .template-textarea {
                width: 100%;
                min-height: 80px;
                resize: vertical;
                padding-right: 30px !important;
                white-space: pre;
                overflow-x: auto;
            }
            .prayer-template-textarea {
                min-height: 40px !important;
                width: 100%;
                resize: vertical;
                padding-right: 30px !important;
                white-space: pre;
                overflow-x: auto;
            }
            .template-reset {
                position: absolute;
                top: 8px;
                right: 8px;
                color: var(--text-muted);
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background-color 0.2s ease;
            }
            .template-reset:hover {
                color: var(--text-accent);
                background-color: var(--background-modifier-hover);
            }
            .template-reset:hover svg {
                transform: rotate(90deg);
                transition: transform 0.3s ease;
            }
            /* Remove all the aggressive styling */
        `;
        containerEl.appendChild(style);

        // General settings (no heading)
        new Setting(containerEl)
            .setName("Prayers to include")
            .setDesc("Comma separated list of prayers to include (used in custom templates)")
            .addText((text) => text
                .setPlaceholder("Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha")
                .setValue(this.plugin.settings.includePrayerNames.join(", "))
                .onChange(async (value) => {
                    this.plugin.settings.includePrayerNames = value.split(",").map((prayer) => prayer.trim());
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
            .setName("UTC Offset")
            .setDesc("Specify the UTC offset to calculate UTC time (when UTC time is enabled).")
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
            .setDesc("File path for prayer times. Supports date placeholders: %YYYY%, %MM%, %DD%, etc.")
            .addText((text) =>
                text
                    .setPlaceholder("Prayer Times.md or Notes/%YYYY%/%MM%/Prayer Times %YYYY%-%MM%-%DD%.md")
                    .setValue(this.plugin.settings.outputLocation)
                    .onChange(async (value) => {
                        const newValue = value.trim();
                        this.plugin.settings.outputLocation = newValue;
                        await this.plugin.saveSettings();
                    })
            );

        // Add extra help for path placeholders
        new Setting(containerEl)
            .setName("Path Placeholders")
            .setDesc(`
You can use these placeholders in your output file path:
%YYYY% - Full year (e.g., 2024)
%YY% - Short year (e.g., 24)
%MM% - Month with leading zero (01-12)
%M% - Month without leading zero (1-12)
%DD% - Day with leading zero (01-31)
%D% - Day without leading zero (1-31)
%MMM% - Month name abbreviation (Jan)
%MMMM% - Full month name (January)
%ddd% - Day name abbreviation (Mon)
%dddd% - Full day name (Monday)

Example: Notes/%YYYY%/%MM%/Prayer Times %YYYY%-%MM%-%DD%.md
            `);

        // Template Settings
        new Setting(containerEl)
            .setHeading()
            .setName("Template Settings");
            
        // Template preset dropdown
        new Setting(containerEl)
            .setName("Template Preset")
            .setDesc("Choose one of the built-in template formats")
            .addDropdown((dropdown) => {
                dropdown
                    .addOption("table", "Table Format")
                    .addOption("checklist", "Checklist Format")
                    .addOption("simple", "Simple List")
                    .setValue(this.plugin.settings.selectedPreset)
                    .onChange(async (value) => {
                        this.plugin.settings.selectedPreset = value;
                        await this.plugin.saveSettings();
                        // Refresh to update formatting options
                        this.display();
                    });
            });
            
        // Custom template toggle
        new Setting(containerEl)
            .setName("Use Custom Template")
            .setDesc("Create your own custom template instead of using a preset")
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.useCustomTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.useCustomTemplate = value;
                        await this.plugin.saveSettings();
                        // Refresh to show/hide the template editor and formatting options
                        this.display();
                    });
            });
        
        // Formatting section (only show when not using custom template)
        if (!this.plugin.settings.useCustomTemplate) {
            new Setting(containerEl)
                .setHeading()
                .setName("Formatting");
                
            // 24-hour time format toggle
            new Setting(containerEl)
                .setName("Use 24-hour Time Format")
                .setDesc("Display times in 24-hour format instead of AM/PM")
                .addToggle((toggle) => {
                    toggle
                        .setValue(this.plugin.settings.use24HourFormat)
                        .onChange(async (value) => {
                            this.plugin.settings.use24HourFormat = value;
                            await this.plugin.saveSettings();
                        });
                });
                
            // Show UTC time toggle (already exists but moved to Formatting section)
            new Setting(containerEl)
                .setName("Show UTC Time")
                .setDesc("Include UTC time column in table or after regular time")
                .addToggle((toggle) => {
                    toggle
                        .setValue(this.plugin.settings.includeUtcTime)
                        .onChange(async (value) => {
                            this.plugin.settings.includeUtcTime = value;
                            await this.plugin.saveSettings();
                        });
                });
                
            // Show date toggle
            new Setting(containerEl)
                .setName("Show Date")
                .setDesc("Display the date in the header")
                .addToggle((toggle) => {
                    toggle
                        .setValue(this.plugin.settings.showDate)
                        .onChange(async (value) => {
                            this.plugin.settings.showDate = value;
                            await this.plugin.saveSettings();
                        });
                });
                
            // Show location toggle
            new Setting(containerEl)
                .setName("Show Location")
                .setDesc("Display the location in the header")
                .addToggle((toggle) => {
                    toggle
                        .setValue(this.plugin.settings.showLocation)
                        .onChange(async (value) => {
                            this.plugin.settings.showLocation = value;
                            await this.plugin.saveSettings();
                        });
                });
        }

        // Only show custom template editor if custom template is enabled
        if (this.plugin.settings.useCustomTemplate) {
            // Main Template with integrated reset button
            const mainTemplateSetting = new Setting(containerEl)
                .setName("Custom Template")
                .setDesc("Design your own template with placeholders for prayer times.");

            const mainTemplateContainer = document.createElement('div');
            mainTemplateContainer.className = 'template-container';
            mainTemplateContainer.style.width = '100%';
            mainTemplateSetting.controlEl.style.maxWidth = '100%';
            mainTemplateSetting.settingEl.style.flexDirection = 'column';
            mainTemplateSetting.settingEl.style.alignItems = 'flex-start';
            mainTemplateSetting.controlEl.style.marginTop = '8px';
            mainTemplateSetting.controlEl.appendChild(mainTemplateContainer);

            const mainTemplateTextarea = document.createElement('textarea');
            mainTemplateTextarea.className = 'template-textarea';
            mainTemplateTextarea.placeholder = "**Date:** %MMMM% %DD%, %YYYY%\n**Location:** %city%\n\n| Prayer | Time | Time (UTC) |\n|--------|------|-------------|\n| Fajr | %fajr% | %fajr_utc% |";
            mainTemplateTextarea.value = this.plugin.settings.template;
            mainTemplateTextarea.addEventListener('change', async () => {
                this.plugin.settings.template = mainTemplateTextarea.value;
                await this.plugin.saveSettings();
            });
            mainTemplateContainer.appendChild(mainTemplateTextarea);

            const mainTemplateResetBtn = document.createElement('button');
            mainTemplateResetBtn.className = 'template-reset';
            mainTemplateResetBtn.setAttribute('aria-label', 'Reset to default template');
            mainTemplateResetBtn.title = 'Reset to default template';
            mainTemplateResetBtn.addEventListener('click', async () => {
                this.plugin.settings.template = DEFAULT_SETTINGS.template;
                mainTemplateTextarea.value = DEFAULT_SETTINGS.template;
                await this.plugin.saveSettings();
            });
            setIcon(mainTemplateResetBtn, 'reset');
            mainTemplateContainer.appendChild(mainTemplateResetBtn);
        }

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
            `);

        // Time placeholders explanation
        new Setting(containerEl)
            .setName("Prayer Time Placeholders")
            .setDesc(`
For each prayer (replace 'prayer' with fajr, dhuhr, asr, etc.):
%prayer% - Standard 12-hour time (e.g., "5:23 AM")
%prayer_24h% - 24-hour time format (e.g., "05:23")
%prayer_utc% - UTC time in 12-hour format
%prayer_24h_utc% - UTC time in 24-hour format

Example: %fajr%, %dhuhr_24h%, %asr_utc%, etc.
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
            
        // Example Templates
        new Setting(containerEl)
            .setName("Example Templates")
            .setDesc(`
Table Format:
| Prayer | Time | Time (UTC) |
|--------|------|-------------|
| Fajr | %fajr% | %fajr_utc% |
| Dhuhr | %dhuhr% | %dhuhr_utc% |

Checkbox Format:
- [ ] Fajr: %fajr%
- [ ] Dhuhr: %dhuhr%
- [ ] Asr: %asr%

Simple List:
Fajr: %fajr%
Dhuhr: %dhuhr%
Asr: %asr%
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
