import { Snowflake } from 'discord.js';
import { DatedMatchOutcome } from '../elo-data-service';
import { datesAreOnSameDay } from '../../common';
import { TreeSet, TreeMap } from 'tstl';

type UserSnowflake = Snowflake;

type UserPairKey = string;

type MatchResultsByDates = Map<UserPairKey, TreeMap<Date, { winner: UserSnowflake, author: UserSnowflake }>>;
type MatchDatesByUsers = Map<UserPairKey, TreeSet<Date>>;

export class MatchHistoryRecorder {

  private matchResultsByUserPair: MatchResultsByDates = new Map();
  private matchDatesIndex: MatchDatesByUsers = new Map();

  public getMatchHistory(user: UserSnowflake, otherUser: UserSnowflake, startDate?: Date, endDate?: Date): DatedMatchOutcome[] {

    const playerMatchHistory =
      this.matchResultsByUserPair.get(this.getUniqueKeyFromUsers(user, otherUser));

    if (playerMatchHistory == null) return [];

    const playerMatchHistoryWithinDates = getEntries(playerMatchHistory).filter((entry: [Date, { winner: UserSnowflake, author: UserSnowflake }]) => {
      const date: Date = entry[0];

      if (startDate != null && date < startDate) return false;
      if (endDate != null && date > endDate) return false;

      return true;
    });

    return playerMatchHistoryWithinDates.map((entry: [Date, { winner: UserSnowflake, author: UserSnowflake }]) => {
      return {
        date: entry[0],
        winner: entry[1].winner,
        author: entry[1].author
      };
    });
  }

  public usersHadMatchOnDate(user: UserSnowflake, otherUser: UserSnowflake, date: Date) {

    const matchDates = this.matchDatesIndex.get(this.getUniqueKeyFromUsers(user, otherUser));

    if (matchDates == null) return false;

    const greatestLessThanDate = findGreatestLessThanOrEqual(matchDates, date);
    const leastGreaterThanDate = findLeastGreaterThanOrEqual(matchDates, date);

    // Type assertions are needed due to the error in the DefinitelyTyped typings.
    if (greatestLessThanDate != null && datesAreOnSameDay(date, greatestLessThanDate)) return true;
    if (leastGreaterThanDate != null && datesAreOnSameDay(date, leastGreaterThanDate)) return true;

    return false;
  }

  public recordMatch(user: UserSnowflake, otherUser: UserSnowflake, date: Date, winner: UserSnowflake, author: UserSnowflake) {
    const updateDateIndex = (userPairKey: string, date: Date) => {

      if (!this.matchDatesIndex.has(userPairKey)) {
        this.matchDatesIndex!.set(userPairKey, new TreeSet<Date>());
      }

      const matchDates = this.matchDatesIndex!.get(userPairKey);

      matchDates!.insert(date);
    };

    const uniqueUserPairKey = this.getUniqueKeyFromUsers(user, otherUser);

    updateDateIndex(uniqueUserPairKey, date);

    if (!this.matchResultsByUserPair.has(uniqueUserPairKey)) {
      this.matchResultsByUserPair!.set(uniqueUserPairKey, new TreeMap());
    }

    this.matchResultsByUserPair!.get(uniqueUserPairKey)!.set(date, { winner, author });
  }

  private getUniqueKeyFromUsers(user: UserSnowflake, otherUser: UserSnowflake): UserPairKey {
    const user1 = user < otherUser ? user : otherUser;
    const user2 = user < otherUser ? otherUser : user;

    return user1 + user2;
  }
}

function findLeastGreaterThanOrEqual<T>(set: TreeSet<T>, value: T): T | undefined {
  if (set.has(value)) return value;
  return set.upper_bound(value).value;
}

function findGreatestLessThanOrEqual<T>(set: TreeSet<T>, value: T): T | undefined {
  if (set.has(value)) return value;
  const it = set.lower_bound(value).prev();
  return it.equals(set.end()) ? undefined : it.value;
}

function getEntries<K,V>(map: TreeMap<K, V>): [K, V][] {
  let arr: [[K, V]] = [] as any;
  // ITERATION
  for (let it = map.begin(); !it.equals(map.end()); it = it.next()) {
    arr.push([it.first, it.second]);
  }

  return arr;
}
