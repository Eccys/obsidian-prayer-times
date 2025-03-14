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
                if (!file || !this.settings.fetchOnNoteOpen) return;
                
                // Process the path with date placeholders and check if it matches the current file
                const processedPath = this.processPathPlaceholders(this.settings.outputLocation);
                
                if (file.path === processedPath) {
                    await this.updatePrayerTimes();
                }
            })
        );

        this.addCommand({
            id: "fetch-prayer-times",
            name: "Fetch Prayer Times",
            callback: async () => await this.updatePrayerTimes(),
        });
    }

    /**
     * Updates the prayer times for the specified date
     */
    async updatePrayerTimes(): Promise<void> {
        const outputPath = this.processPathPlaceholders(this.settings.outputLocation);
        
        try {
            const prayerTimesContent = await fetchPrayerTimes(this.settings);
            await this.updateCustomFile(outputPath, prayerTimesContent);
        } catch (error) {
            console.error(`Failed to update prayer times: ${error}`);
            new Notice(`Prayer Times Plugin: Failed to update prayer times. ${error}`);
        }
    }
    
    // Process date placeholders in file paths
    processPathPlaceholders(path: string): string {
        if (!path) return "Prayer Times.md";
        
        const date = new Date();
        
        // Replace date placeholders in path
        let processedPath = path
            .replace(/%YYYY%/g, date.getFullYear().toString())
            .replace(/%YY%/g, date.getFullYear().toString().slice(-2))
            .replace(/%MM%/g, (date.getMonth() + 1).toString().padStart(2, '0'))
            .replace(/%M%/g, (date.getMonth() + 1).toString())
            .replace(/%DD%/g, date.getDate().toString().padStart(2, '0'))
            .replace(/%D%/g, date.getDate().toString())
            .replace(/%ddd%/g, date.toLocaleString('default', { weekday: 'short' }))
            .replace(/%dddd%/g, date.toLocaleString('default', { weekday: 'long' }))
            .replace(/%MMM%/g, date.toLocaleString('default', { month: 'short' }))
            .replace(/%MMMM%/g, date.toLocaleString('default', { month: 'long' }));
            
        console.log(`Processed path: "${path}" → "${processedPath}"`);
        return processedPath;
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
                console.log(`Updated existing file: ${filePath}`);
            } else {
                // Create parent folders if they don't exist
                if (filePath.includes('/')) {
                    const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
                    if (!vault.getAbstractFileByPath(folderPath)) {
                        await vault.createFolder(folderPath);
                        console.log(`Created folder: ${folderPath}`);
                    }
                }
                await vault.create(filePath, content);
                console.log(`Created new file: ${filePath}`);
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

