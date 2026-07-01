import { BaseRepository } from "../../../core/models/base.repository";
import UserBonus from "./user-bonus.model";

class UserBonusRepository extends BaseRepository<UserBonus> {
  constructor() {
    super(UserBonus);
  }
}

export default new UserBonusRepository();
