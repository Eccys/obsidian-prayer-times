# Prayer Times Plugin

## Overview
The Prayer Times Plugin is an Obsidian plugin designed to fetch and display prayer times based on a selected city. This plugin allows users to retrieve prayer schedules from a variety of cities around the world, displaying them in a clean and customizable table format. The times can be adjusted to different time formats (24-hour or 12-hour) and include additional information like the date and location.

## Features
- **City Selection**: Automatically fetch prayer times based on a selected city (e.g., New York).
- **Customizable Time Format**: Display times in either 24-hour or 12-hour format.
- **Flexible Prayer Time Display**: Choose which prayer times to include in the output.
- **Date & Location Inclusion**: Optionally include the date and location of the prayer times in the generated output.
- **Automatic Updates**: The plugin automatically fetches prayer times when the workspace is ready.

## Installation
1. Download the plugin files or clone the repository to your local machine.
2. Go to **Settings** in Obsidian, then navigate to **Community Plugins**.
3. Enable **Safe Mode** (if it’s not already enabled), and then click on **Browse** to search for the plugin.
4. Upload the plugin by clicking on the **Install** button, and then activate it.

## Configuration
You can configure the plugin through the settings tab in Obsidian:
- **City**: Select the city for which you want to fetch prayer times.
- **Time Format**: Choose between 12-hour or 24-hour time format.
- **Prayers to Include**: Specify which prayers you want to display (e.g., Fajr, Dhuhr, Asr).
- **Include Date**: Choose whether to include the current date in the output.
- **Include Location**: Choose whether to include the city name in the output.
- **Date Format**: Choose the format for displaying the date (e.g., MM/DD/YYYY, YYYY-MM-DD).

## Usage
Once the plugin is installed and configured:
1. Click the **Fetch Prayer Times** command from the command palette.
2. The plugin will fetch and display the prayer times in your preferred format.
3. You can view the results in the **Prayer Times.md** file created in your vault.

## Example Output

**Date**: 11/23/2024
**Location**: New York

| Prayer       | Time      | Time (UTC) |
|--------------|-----------|------------|
| Fajr         | 05:00 AM  | 10:00 AM   |
| Dhuhr        | 12:15 PM  | 05:15 PM   |
| Asr          | 03:45 PM  | 08:45 PM   |
| Maghrib      | 06:10 PM  | 11:10 PM   |
| Isha         | 07:30 PM  | 12:30 AM   |


