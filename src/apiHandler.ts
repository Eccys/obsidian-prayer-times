import { PrayerTimesSettings } from "./settings";

export async function fetchPrayerTimes(settings: PrayerTimesSettings): Promise<string> {
    const {
        city,
        prayersToInclude,
        includeDate,
        includeLocation,
        dateFormat,
        timeFormat24h,
        includeUtcTime,
        utcOffset,
    } = settings;

    const apiUrl = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=&method=2`;
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

    const data = await response.json();
    if (!data || !data.data || !data.data.date) throw new Error("Invalid data received from API");

    const rawDate = data.data.date.readable;
    const formattedDate = window.moment(rawDate, "DD MMM YYYY").format(dateFormat);

    const filteredPrayerTimes = Object.entries(data.data.timings).filter(([key]) =>
        prayersToInclude.includes(key)
    );

    const formattedPrayerTimes = filteredPrayerTimes
        .map(([prayer, time]) => {
            const localTime = `${rawDate} ${time}`;
            const localDate = new Date(localTime);

            const formattedLocalTime = localDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: !timeFormat24h,
            });

            // Calculate UTC time if includeUtcTime is true
            const formattedUtcTime = includeUtcTime
                ? new Date(localDate.getTime() - utcOffset * 60 * 60 * 1000).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: !timeFormat24h,
                  })
                : "";

            // Include UTC column only if includeUtcTime is true
            return includeUtcTime
                ? `| ${prayer.padEnd(12)} | ${formattedLocalTime.padEnd(8)} | ${formattedUtcTime.padEnd(8)} |`
                : `| ${prayer.padEnd(12)} | ${formattedLocalTime.padEnd(8)} |`;
        })
        .join("\n");

    let content = "";
    if (includeDate) content += `**Date:** ${formattedDate}\n`;
    if (includeLocation) content += `**Location:** ${city}\n\n`;

    // Include UTC column header only if includeUtcTime is true
    content += includeUtcTime
        ? "| Prayer       | Time       | Time (UTC) |\n"
        : "| Prayer       | Time       |\n";

    content += includeUtcTime
        ? "|--------------|------------|------------|\n"
        : "|--------------|------------|\n";

    content += `${formattedPrayerTimes}\n`;

    return content;
}
