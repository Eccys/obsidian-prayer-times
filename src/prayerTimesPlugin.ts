import { Plugin, TFile, Notice } from "obsidian";
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
            this.app.workspace.onLayoutReady(async () => {
                await this.updatePrayerTimes();
            });
        }

        // Handle fetch on note open
        this.registerEvent(
            this.app.workspace.on("file-open", async (file) => {
                if (!file) return;
                
                // For dedicated prayer times file
                if (this.settings.outputLocation === "dedicated" && 
                    this.settings.fetchOnNoteOpen && 
                    file.name === "Prayer Times.md") {
                    await this.updatePrayerTimes();
                }
                
                // For daily notes
                if (this.settings.outputLocation === "daily") {
                    const today = window.moment().format(this.settings.dailyNoteFormat);
                    const dailyNoteFilename = `${today}.md`;
                    
                    if (file.name === dailyNoteFilename && this.settings.fetchOnNoteOpen) {
                        await this.updatePrayerTimes();
                    }
                }
            })
        );

        this.addCommand({
            id: "fetch-prayer-times",
            name: "Fetch Prayer Times",
            callback: async () => await this.updatePrayerTimes(),
        });
    }

    async updatePrayerTimes() {
        try {
            const content = await fetchPrayerTimes(this.settings);
            
            if (this.settings.outputLocation === "dedicated") {
                await this.updateDedicatedFile(content);
            } else {
                await this.updateDailyNote(content);
            }

            new Notice("Prayer times updated successfully!");
        } catch (error) {
            console.error("Failed to fetch prayer times:", error);
            new Notice("Failed to fetch prayer times. Check the console for details.");
        }
    }
    
    async updateDedicatedFile(content: string) {
        const filePath = "Prayer Times.md";
        const vault = this.app.vault;
        const existingFile = vault.getAbstractFileByPath(filePath);

        if (existingFile instanceof TFile) {
            await vault.modify(existingFile, content);
        } else {
            await vault.create(filePath, content);
        }
    }
    
    async updateDailyNote(content: string) {
        const vault = this.app.vault;
        const today = window.moment().format(this.settings.dailyNoteFormat);
        const dailyNoteFilePath = `${today}.md`;
        const sectionHeading = this.settings.sectionHeading;
        
        // Check if the daily note exists
        let dailyNote = vault.getAbstractFileByPath(dailyNoteFilePath);
        
        if (dailyNote instanceof TFile) {
            // If daily note exists, update it
            let existingContent = await vault.read(dailyNote);
            
            // Preserve checkbox states if template contains any checkboxes
            if (this.settings.prayerTemplate.includes('[ ]')) {
                // Find existing prayer times section using the configurable heading
                const sectionRegex = new RegExp(`## ${sectionHeading}[\\s\\S]*?(?=\\n## |$)`);
                const prayerTimesMatch = existingContent.match(sectionRegex);
                
                if (prayerTimesMatch) {
                    const prayerTimesSection = prayerTimesMatch[0];
                    
                    // Extract checkbox state based on prayer name from old content
                    const checkboxStates = new Map();
                    const checkboxRegex = /- \[([ xX])\] (.*?)(?=:| |$)/g;
                    let match;
                    
                    while ((match = checkboxRegex.exec(prayerTimesSection)) !== null) {
                        const isChecked = match[1].trim() !== '';
                        const prayerName = match[2].trim();
                        checkboxStates.set(prayerName, isChecked);
                    }
                    
                    // Preserve checkbox states in the new content
                    if (checkboxStates.size > 0) {
                        content = content.replace(
                            /- \[[ ]\] (.*?)(?=:| |$)/g, 
                            (match, prayerName) => {
                                const isChecked = checkboxStates.get(prayerName.trim());
                                return isChecked 
                                    ? `- [x] ${prayerName}` 
                                    : match;
                            }
                        );
                    }
                }
            }
            
            // Process template for daily notes
            let processedContent = this.settings.dailyTemplate.replace(/%prayers%/g, content);
            
            // Check if the prayer times section already exists using the configurable heading
            const sectionRegex = new RegExp(`## ${sectionHeading}[\\s\\S]*?(?=\\n## |$)`);
            
            if (sectionRegex.test(existingContent)) {
                // Replace existing prayer times section
                existingContent = existingContent.replace(
                    sectionRegex,
                    `## ${sectionHeading}\n\n${processedContent}`
                );
            } else {
                // Add prayer times section at the end
                existingContent = `${existingContent.trim()}\n\n## ${sectionHeading}\n\n${processedContent}`;
            }
            
            await vault.modify(dailyNote, existingContent);
        } else if (this.settings.autoCreateDailyNote) {
            // Process template for daily notes
            let processedContent = this.settings.dailyTemplate.replace(/%prayers%/g, content);
            
            // Create new daily note with prayer times
            const newContent = `# ${today}\n\n## ${sectionHeading}\n\n${processedContent}`;
            await vault.create(dailyNoteFilePath, newContent);
        } else {
            // If auto-create is disabled, show an error
            throw new Error(`Daily note for ${today} doesn't exist and auto-create is disabled.`);
        }
    }

    async resetSettings() {
        // Reset to default settings
        this.settings = Object.assign({}, DEFAULT_SETTINGS);
        await this.saveSettings();
        // Show confirmation notice
        new Notice("Prayer Times settings reset to defaults.");
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

