import { Snowflake } from 'discord.js';
import { EloDataService } from '../../data/elo-data-service';

export const getRatingOrDefault = async (user: Snowflake, server: Snowflake, dataService: EloDataService): Promise<number> => {
  const ratingFromDatabase = await dataService.getRating(user, server);
  return ratingFromDatabase == null ? 1000 : ratingFromDatabase;
};
