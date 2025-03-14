import { Plugin, TFile, Notice } from "obsidian";
import { PrayerTimesSettings, DEFAULT_SETTINGS } from "./settings";
import PrayerTimesSettingTab from "./settingsTab";
import { fetchPrayerTimes } from "./apiHandler";

export default class PrayerTimesPlugin extends Plugin {
    settings: PrayerTimesSettings;

    async onload() {
        // Load settings without awaiting to avoid blocking initialization
        await this.loadSettings();
        
        // Add settings tab immediately to ensure UI is responsive
        this.addSettingTab(new PrayerTimesSettingTab(this.app, this));
        
        // Register events and commands after settings are loaded
        this.registerEvents();
        this.addCommands();
    }

    /**
     * Register plugin events
     */
    private registerEvents(): void {
        // Only setup prayer time fetching if the setting is enabled
        if (this.settings.fetchOnLaunch) {
            // Use a single timeout to defer execution to prevent duplicate calls
            const timeoutId = setTimeout(() => {
                this.app.workspace.onLayoutReady(() => {
                    this.updatePrayerTimes();
                });
                // Clear the timeout to prevent memory leaks
                clearTimeout(timeoutId);
            }, 1000);
        }

        // Handle fetch on note open - optimize the check
        this.registerEvent(
            this.app.workspace.on("file-open", (file) => {
                if (!file || !this.settings.fetchOnNoteOpen) return;
                
                // Only process path if we really need to
                const processedPath = this.processPathPlaceholders(this.settings.outputLocation);
                
                if (file.path === processedPath) {
                    this.updatePrayerTimes();
                }
            })
        );
    }

    /**
     * Add plugin commands
     */
    private addCommands(): void {
        this.addCommand({
            id: "fetch-prayer-times",
            name: "Fetch Prayer Times",
            callback: () => this.updatePrayerTimes(),
        });
    }

    /**
     * Updates the prayer times for the specified date
     */
    async updatePrayerTimes(): Promise<void> {
        try {
            const outputPath = this.processPathPlaceholders(this.settings.outputLocation);
            
            // Fetch prayer times first
            const prayerTimesContent = await fetchPrayerTimes(this.settings);
            
            // Then update the file - let updateCustomFile handle notifications
            await this.updateCustomFile(outputPath, prayerTimesContent);
        } catch (error) {
            console.error(`Failed to update prayer times: ${error}`);
            new Notice(`Prayer Times Plugin: Failed to update prayer times. ${error}`);
        }
    }
    
    // Process date placeholders in file paths - optimized version
    processPathPlaceholders(path: string): string {
        if (!path) return "Prayer Times.md";
        
        // Cache date components to avoid repeated calculations
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // Create a replacement map for faster substitution
        const replacements: Record<string, string> = {
            '%YYYY%': year.toString(),
            '%YY%': year.toString().slice(-2),
            '%MM%': month.toString().padStart(2, '0'),
            '%M%': month.toString(),
            '%DD%': day.toString().padStart(2, '0'),
            '%D%': day.toString(),
            '%ddd%': date.toLocaleString('default', { weekday: 'short' }),
            '%dddd%': date.toLocaleString('default', { weekday: 'long' }),
            '%MMM%': date.toLocaleString('default', { month: 'short' }),
            '%MMMM%': date.toLocaleString('default', { month: 'long' })
        };
        
        // Use a single regex to replace all placeholders in one pass
        return path.replace(/%(?:YYYY|YY|MM|M|DD|D|ddd|dddd|MMM|MMMM)%/g, match => 
            replacements[match] || match
        );
    }
    
    // This function is now deprecated but kept for backward compatibility
    async updateDedicatedFile(content: string) {
        await this.updateCustomFile("Prayer Times.md", content);
    }
    
    // New function to handle custom file paths with placeholder support
    async updateCustomFile(filePath: string, content: string) {
        const vault = this.app.vault;
        
        // Ensure filePath is a valid string and set default if empty
        if (!filePath || filePath.trim() === "") {
            filePath = "Prayer Times.md";
            console.log("Using default file path: Prayer Times.md");
        }
        
        // Add .md extension if missing
        if (!filePath.toLowerCase().endsWith(".md")) {
            filePath = `${filePath}.md`;
            console.log(`Added .md extension to file path: ${filePath}`);
        }
        
        try {
            const existingFile = vault.getAbstractFileByPath(filePath);

            if (existingFile instanceof TFile) {
                // Before modifying, check if this file contains checkboxes and preserve their state
                if (existingFile instanceof TFile && content.includes('- [ ]')) {
                    const existingContent = await vault.read(existingFile);
                    
                    // Extract checkbox state based on prayer name from old content
                    const checkboxStates = new Map();
                    const checkboxRegex = /- \[([ xX])\] (.*?)(?=:| |$)/g;
                    let match;
                    
                    while ((match = checkboxRegex.exec(existingContent)) !== null) {
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
                
                await vault.modify(existingFile, content);
                new Notice("Prayer times updated successfully.");
            } else {
                // Create parent folders if they don't exist
                if (filePath.includes('/')) {
                    const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
                    if (!vault.getAbstractFileByPath(folderPath)) {
                        await vault.createFolder(folderPath);
                    }
                }
                await vault.create(filePath, content);
                new Notice(`Prayer times file created: ${filePath}`);
            }
        } catch (error) {
            console.error(`Error handling file ${filePath}:`, error);
            new Notice(`Error with file ${filePath}. Please check the console for details.`);
            throw error;
        }
    }

    async updateDailyNote(content: string) {
        // This method is no longer needed - we're using path placeholders instead
        // Delegate to the new method for backward compatibility
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const dailyNotePath = `${formattedDate}.md`;
        
        await this.updateCustomFile(dailyNotePath, content);
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
        
        // Ensure outputLocation is valid
        if (!this.settings.outputLocation || this.settings.outputLocation.trim() === "") {
            this.settings.outputLocation = "Prayer Times.md";
            await this.saveSettings();
            console.log("Reset empty output location to default: Prayer Times.md");
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

