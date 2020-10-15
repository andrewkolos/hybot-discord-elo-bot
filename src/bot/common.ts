import { Snowflake } from 'discord.js';

export const nameof = <T>(key: keyof T) => key;

/**
 * Determines if two `Date` objects have the same calendar day and year.
 * @param date Some date.
 * @param otherDate The other date to compare to.
 * @returns  `true` if the dates represent the same calendar day and year. `false` otherwise.
 */
export function datesAreOnSameDay(date: Date, otherDate: Date) {
  return (date.getDate() === otherDate.getDate() &&
    date.getMonth() === otherDate.getMonth() &&
    date.getFullYear() === otherDate.getFullYear());
}

/**
 * Function that defines an ordering amongst user IDs.
 * @param user A user.
 * @param otherUser Another user. The order of user IDs does not matter.
 * @returns The users as an ordered pair.
 * @remarks This is meant to be used to alone data services to save/read information regarding two users
 * without needing to worry about ordering. For example, given users A and B--and assuming A is ordered
 * before B by this function--a database query looking for all matches between these users only needs
 * to search for matches where user1=A and user2=B, not matches where user1=A and user2=B OR matches where
 * user1=B and user2=A.
 */
export function getUsersAsOrderedPair(user: Snowflake, otherUser: Snowflake): [Snowflake, Snowflake] {
  return user < otherUser ? [user, otherUser] : [otherUser, user];
}
