import { SessionDto } from '../models/session.dto';
import { Session } from '../models/session.model';

export function toSession(dto: SessionDto): Session {
  return {
    accessToken: dto.accessToken,
    expiresAt: new Date(dto.expiresAt),
    name: dto.name,
    username: dto.username,
  };
}
