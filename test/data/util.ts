export const dayBefore = (date: Date) => new Date(new Date().setDate(date.getDate() - 1));
export const dateDiffInMinutes = (date1: Date, date2: Date): number => {
  const diffInMs = Math.abs(date1.getTime() - date2.getTime());
  const diffInSeconds = diffInMs / 1000;
  return Math.floor(diffInSeconds / 60);
};
export const withinOneMs = (date1: Date, date2: Date): boolean => {
  const diffInMs = Math.abs(date1.getTime() - date2.getTime());
  return diffInMs < 1;
};
