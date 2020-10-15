import { EloDataService, UserRatingPair, DatedMatchOutcome } from '../elo-data-service';
import { Snowflake } from 'discord.js';
import { TreeMap } from 'jstreemap';
import { MatchHistoryRecorder } from './match-history-recorder';

type ServerSnowFlake = Snowflake;
type UserSnowFlake = Snowflake;
type Rating = number;

type PlayerToRatingMap = Map<UserSnowFlake, Rating>;

class ServerInformation {
  public ratingsByPlayer: PlayerToRatingMap = new Map();
  public playersByRating: TreeMap<number, Set<UserSnowFlake>> = new TreeMap();
  public matchHistory = new MatchHistoryRecorder();
}

export class InMemoryEloDataService implements EloDataService {

  /** @inheritdoc */
  public isUserRated(user: UserSnowFlake, server: ServerSnowFlake): Promise<boolean> {
    const userRating = this.getUserRating(user, server);

    if (userRating == null) return Promise.resolve(false);
    else return Promise.resolve(true);
  }

  /** @inheritdoc */
  public getRating(user: UserSnowFlake, server: ServerSnowFlake): Promise<number | undefined> {
    const userRating = this.getUserRating(user, server);
    return Promise.resolve(userRating);
  }

  /** @inheritdoc */
  public setRating(user: UserSnowFlake, server: ServerSnowFlake, rating: number): Promise<void> {
    const serverInfo = this.getServerInformation(server);

    const updateRatingsByPlayerMap = (oldRating: number | undefined) => {

      if (oldRating != null) {
        const playersWithOldRating = serverInfo.playersByRating.get(oldRating);
        if (playersWithOldRating != null) {
          playersWithOldRating.delete(user);
        }
      }

      if (!serverInfo.playersByRating.has(rating)) {
        serverInfo.playersByRating.set(rating, new Set());
      }

      const playersWithRating: Set<UserSnowFlake> = serverInfo.playersByRating.get(rating)!;
      playersWithRating.add(user);
    };

    const oldRating = serverInfo.ratingsByPlayer.get(user);

    updateRatingsByPlayerMap(oldRating);
    serverInfo.ratingsByPlayer.set(user, rating);

    return Promise.resolve();
  }

  /** @inheritdoc */
  public addMatch(user: string, otherUser: string, server: string, date: Date,
    winner: string, author: string): Promise<void> {

    const serverInfo = this.getServerInformation(server);

    return Promise.resolve(serverInfo.matchHistory.recordMatch(user, otherUser, date, winner, author));
  }

  /** @inheritdoc */
  public getMatchHistory(user1: string, user2: string, server: string, startDate?: Date, endDate?: Date): Promise<DatedMatchOutcome[]> {
    return Promise.resolve(this.getServerInformation(server).matchHistory.getMatchHistory(user1, user2, startDate, endDate));
  }

  /** @inheritdoc */
  public getTopNPlayers(server: ServerSnowFlake, n: number): Promise<UserRatingPair[]> {
    const serverInfo = this.getServerInformation(server);

    const playersByRating = serverInfo.playersByRating;

    const entriesInAscendingOrderOfRating: [number, Set<UserSnowFlake>][] = Array.from(playersByRating.entries());

    const lastNEntries = entriesInAscendingOrderOfRating.slice(-n);

    const topNPlayers = new Array<UserRatingPair>(n);
    let numUsersLeftToPick = n;

    userPickingLoop:
    for (let entryIndex = 0; entryIndex < lastNEntries.length; entryIndex++) {
      const entry = lastNEntries[entryIndex];
      const rating: number = entry[0];
      const playerList: UserSnowFlake[] = Array.from(entry[1]);

      for (let playerIndex = 0; playerIndex < playerList.length; playerIndex++) {
        if (numUsersLeftToPick <= 0) break userPickingLoop;
        const player = playerList[playerIndex];
        topNPlayers.push({ user: player, rating });
        numUsersLeftToPick--;
      }
    }

    return Promise.resolve(topNPlayers.reverse());
  }

  private getUserRating(user: UserSnowFlake, server: ServerSnowFlake): number | undefined {
    const serverInfo = this.getServerInformation(server);

    return serverInfo.ratingsByPlayer.get(user);
  }

  private getServerInformation(server: ServerSnowFlake) {
    let serverInformation = this.serverInfo.get(server);

    if (serverInformation == null) {
      serverInformation = new ServerInformation();
      this.serverInfo.set(server, serverInformation);
    }

    return serverInformation;
  }

  private serverInfo: Map<ServerSnowFlake, ServerInformation> = new Map();
}
