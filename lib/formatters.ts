// Funkcja pomocnicza formatTimeFromSeconds (bez zmian, jeśli ją masz)
const formatTimeFromSeconds = (seconds: number): string => {
    if (seconds <= 0) return 'obliczanie...';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    let timeStr = '';
    if (hours > 0) {
        timeStr += `${hours}h `;
    }
    if (minutes >= 0) {
        timeStr += `${minutes}m`;
    }
    return timeStr.trim() || '0m';
};