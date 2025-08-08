import { UserEventsHandler } from './user-events.handler';
import { NewTokenEventsHandler } from './new-token-events.handler';
import { CommentEventsHandler } from './comment-events.handler';
import { EmojiEventsHandler } from './emoji-events.handler';

export const DefinitionHandlers = [
  UserEventsHandler, 
  NewTokenEventsHandler, 
  CommentEventsHandler,
  EmojiEventsHandler
];