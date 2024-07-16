// Timestamp in milliseconds
const timestamp = 1721116429277;
export const getReadableTime = (timeStamp: Date) => {
    const date = new Date(timestamp);

    // Extract and format the time part
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    const readableTime = `${hours}:${minutes}`;
    return readableTime
}
