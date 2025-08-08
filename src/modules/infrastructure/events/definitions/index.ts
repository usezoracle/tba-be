import { UserCreatedEvent } from './user-created.event';
import { CommentCreatedEvent } from './comment-created.event';
import { EmojiReactedEvent } from './emoji-reacted.event';

export { UserCreatedEvent } from './user-created.event';
export { CommentCreatedEvent } from './comment-created.event';
export { EmojiReactedEvent } from './emoji-reacted.event';

export const EventDefinitions = [UserCreatedEvent, CommentCreatedEvent, EmojiReactedEvent];