// Timestamp in milliseconds (Redis returns as string, so we convert to number)
export const getReadableTime = (timeStamp: Date | string | number) => {
    const date = new Date(typeof timeStamp === 'string' ? Number(timeStamp) : timeStamp);

    // Extract and format the time part
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    const readableTime = `${hours}:${minutes}`;
    return readableTime
}
