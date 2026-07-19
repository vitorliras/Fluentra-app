import { UserDto } from '../models/user.dto';
import { User } from '../models/user.model';

export function toUser(dto: UserDto): User {
  return {
    id: dto.id,
    name: dto.name,
    username: dto.username,
    email: dto.email,
  };
}
