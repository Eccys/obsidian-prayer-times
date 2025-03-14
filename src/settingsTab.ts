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
                min-height: 120px;
                resize: vertical;
                padding-right: 30px !important;
                white-space: pre;
                overflow-x: auto;
                font-family: var(--font-monospace);
                box-sizing: border-box;
                margin-top: 8px;
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

        // Output Configuration - Now placed above template and formatting
        new Setting(containerEl)
            .setHeading()
            .setName("Output");

        new Setting(containerEl)
            .setName("Output Location")
            .setDesc("File path for prayer times. Supports %YYYY%, %MM%, %DD%, etc..")
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

        // Template and Formatting - Moved after output configuration
        new Setting(containerEl)
            .setHeading()
            .setName("Template and Formatting");
        
        // Template preset dropdown
        new Setting(containerEl)
            .setName("Template Format")
            .setDesc("Choose a template format or create your own custom template")
            .addDropdown((dropdown) => {
                dropdown
                    .addOption("table", "Table Format")
                    .addOption("checklist", "Checklist Format")
                    .addOption("simple", "Simple List")
                    .addOption("custom", "Custom Template")
                    .setValue(this.plugin.settings.selectedPreset)
                    .onChange(async (value) => {
                        this.plugin.settings.selectedPreset = value;
                        await this.plugin.saveSettings();
                        // Refresh to update formatting options
                        this.display();
                    });
            });

        // Show custom template editor immediately after dropdown if custom is selected
        if (this.plugin.settings.selectedPreset === "custom") {
            // Main Template with integrated reset button
            const mainTemplateSetting = new Setting(containerEl)
                .setName("Custom Template")
                .setDesc("Placeholders are available in the README file.");

            const mainTemplateContainer = document.createElement('div');
            mainTemplateContainer.className = 'template-container';
            
            mainTemplateSetting.controlEl.appendChild(mainTemplateContainer);
            mainTemplateSetting.settingEl.style.display = "block";
            mainTemplateSetting.controlEl.style.display = "block";
            mainTemplateSetting.controlEl.style.width = "100%";

            const mainTemplateTextarea = document.createElement('textarea');
            mainTemplateTextarea.className = 'template-textarea';
            mainTemplateTextarea.placeholder = "**Location:** %city%\n**Date:** %MMMM% %DD%, %YYYY%\n\n| Prayer | Time | Time (UTC) |\n|--------|------|-------------|\n| Fajr | %fajr% | %fajr_utc% |";
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

        } else {
            
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
            // Only show formatting options if not using custom template
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

            // Show UTC time toggle
            new Setting(containerEl)
                .setName("Show UTC Time")
                .setDesc("Include UTC time column in table or after regular time")
                .addToggle((toggle) => {
                    toggle
                        .setValue(this.plugin.settings.includeUtcTime)
                        .onChange(async (value) => {
                            this.plugin.settings.includeUtcTime = value;
                            await this.plugin.saveSettings();
                            // Refresh to show/hide UTC offset setting
                            this.display();
                        });
                });

            // Only show UTC offset if UTC time is enabled
            if (this.plugin.settings.includeUtcTime) {
                new Setting(containerEl)
                    .setName("UTC Offset")
                    .setDesc("Specify the UTC offset to calculate UTC time")
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
            }
        }

        // Add reset to default button
        new Setting(containerEl)
            .setHeading()
            .setName("Reset");
            
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
