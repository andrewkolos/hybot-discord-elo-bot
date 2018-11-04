import { Command } from '../command';
import { Client, Message } from 'discord.js';
import { DataService } from '../../data/dataservice';

export const Roll: Command = (_client: Client, message: Message, args: string[], _dataService: DataService) => {
  const dice = args.join('').trim();
  const numDice = parseInt(dice.split('d')[0]);

  const diceAndModifier = dice.split('d')[1];

  if (diceAndModifier == null) {
    message.channel.send('Please enter a dice string.');
  }

  let maxRoll = 0;
  let modifier = 0;
  if (diceAndModifier.indexOf('+') !== -1) {
    maxRoll = parseInt(diceAndModifier.split('+')[0]);
    modifier = parseInt(diceAndModifier.split('+')[1]);
  } else if (diceAndModifier.indexOf('-') !== -1) {
    maxRoll = parseInt(diceAndModifier.split('-')[0]);
    modifier = parseInt(diceAndModifier.split('-')[1]) * -1;
  } else {
    maxRoll = parseInt(diceAndModifier);
  }

  const results = [];
  let total = Number(modifier);
  for (let die = 0; die < numDice; die++) {
    const n = Math.floor(Math.random() * maxRoll + 1);
    results.push(n);
    total += n;
  }

  message.channel.send('Results: ' + results.join(' ') + ' | Total With Modifier: ' + total);
};
