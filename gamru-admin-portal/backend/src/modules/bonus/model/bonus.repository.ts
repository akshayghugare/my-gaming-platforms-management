import { BaseRepository } from "../../../core/models/base.repository";
import Bonus from "./bonus.model";

class BonusRepository extends BaseRepository<Bonus> {
  constructor() {
    super(Bonus);
  }

  byExternalId(externalBonusId: string): Promise<Bonus | null> {
    return this.findOne({ external_bonus_id: externalBonusId });
  }
}

export default new BonusRepository();
