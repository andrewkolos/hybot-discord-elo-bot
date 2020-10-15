import { MatchHistoryRecorder } from '../../../src/bot/data/in-memory-implementation/match-history-recorder';
import { SnowflakeUtil } from 'discord.js';
import { DatedMatchOutcome } from '../../../src/bot/data/elo-data-service';

const user1 = SnowflakeUtil.generate();
const user2 = SnowflakeUtil.generate();

describe(nameof(MatchHistoryRecorder), () => {
  it('records a match', () => {
    const recorder = new MatchHistoryRecorder();
    const matchDate = new Date();
    recorder.recordMatch(user1, user2, matchDate, user1, user2);
    expect(recorder.getMatchHistory(user1, user2)).toEqual([{
      date: matchDate,
      winner: user1,
      author: user2,
    }]);
  });

  it('retrieves match history correctly, regardless of the order of the specification of the users', () => {
    const recorder = new MatchHistoryRecorder();
    const matchDate = new Date();
    recorder.recordMatch(user1, user2, matchDate, user1, user1);
    expect(recorder.getMatchHistory(user2, user1)[0].date).toBe(matchDate);
  });

  it('correctly identifies if a match with two users ocurred on a given date', () => {
    const recorder = new MatchHistoryRecorder();
    const matchDate = new Date();
    recorder.recordMatch(user1, user2, matchDate, user1, user1);
    expect(recorder.usersHadMatchOnDate(user1, user2, matchDate)).toBe(true);
    expect(recorder.usersHadMatchOnDate(user1, user2, new Date(0))).toBe(false);
  });

  it('correctly stores the match history and in chronological order', () => {
    const recorder = new MatchHistoryRecorder();
    const earlierDate = new Date(2019, 0, 1);
    const laterDate = new Date(2019, 0, 2);

    recorder.recordMatch(user1, user2, laterDate, user1, user1);
    recorder.recordMatch(user1, user2, earlierDate, user1, user1);

    const matchHistory = recorder.getMatchHistory(user1, user2);

    expect(matchHistory[0].date).toBe(earlierDate);
    expect(matchHistory[1].date).toBe(laterDate);
  });

  it('correctly stores the winner of a match', () => {
    const recorder = new MatchHistoryRecorder();

    recorder.recordMatch(user1, user2, new Date(), user2, user1);

    const matchHistory: DatedMatchOutcome[] = recorder.getMatchHistory(user1, user2);
    expect(matchHistory[0].winner).toBe(user2);
  });

  it('correctly stores the author of a match record', () => {
    const recorder = new MatchHistoryRecorder();

    const earlierDate = new Date(2019, 0, 1);
    const laterDate = new Date(2019, 0, 2);
    recorder.recordMatch(user1, user2, earlierDate, user1, user1);
    recorder.recordMatch(user1, user2, laterDate, user1, user2);

    const matchHistory: DatedMatchOutcome[] = recorder.getMatchHistory(user1, user2);
    expect(matchHistory[1].author).toBe(user2);
  });
});
