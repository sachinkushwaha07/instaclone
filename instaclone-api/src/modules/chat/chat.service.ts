import { HttpError } from '../../middleware/error.middleware';
import { chatRepository } from './chat.repository';

export const chatService = {
  async list(userId: string) { return chatRepository.list(userId); },
  async create(userId: string, participantId: unknown) {
    if (typeof participantId !== 'string' || participantId === userId) throw new HttpError(400, 'Choose another user to message.');
    if (!(await chatRepository.userExists(participantId))) throw new HttpError(404, 'User not found.');
    return chatRepository.create(userId, participantId);
  },
  async messages(userId: string, conversationId: string) {
    if (!(await chatRepository.isMember(conversationId, userId))) throw new HttpError(404, 'Conversation not found.');
    return chatRepository.messages(conversationId);
  },
  async send(userId: string, conversationId: string, rawText: unknown) {
    if (!(await chatRepository.isMember(conversationId, userId))) throw new HttpError(404, 'Conversation not found.');
    if (typeof rawText !== 'string' || !rawText.trim() || rawText.trim().length > 2000) throw new HttpError(400, 'Message must contain 1 to 2,000 characters.');
    return chatRepository.send(conversationId, userId, rawText.trim());
  },
};
