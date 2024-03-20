export function addHoursToDate(hours = 0, date = new Date()) {
  if (typeof hours !== 'number') {
    throw new Error('Invalid "hours" argument');
  }

  if (!(date instanceof Date)) {
    throw new Error('Invalid "date" argument');
  }

  date.setHours(date.getHours() + hours);

  return date;
}
