import { COMMANDS } from '../constants/commands.js';

export function getCommands({ withSlash = true }) {
  const commands = [];

  for (const [_, command] of Object.entries(COMMANDS)) {
    commands.push(withSlash ? '/' + command : command);
  }

  return commands;
}
