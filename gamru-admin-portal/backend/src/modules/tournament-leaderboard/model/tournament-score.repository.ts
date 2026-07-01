import { BaseRepository } from "../../../core/models/base.repository";
import TournamentScore from "./tournament-score.model";

class TournamentScoreRepository extends BaseRepository<TournamentScore> {
  constructor() {
    super(TournamentScore);
  }

  findOneFor(tournamentId: string, email: string) {
    return this.model.findOne({
      where: { tournament_id: tournamentId, email },
    });
  }

  /** Standings for one tournament, best score first. */
  standings(tournamentId: string) {
    return this.model.findAll({
      where: { tournament_id: tournamentId },
      order: [
        ["score", "DESC"],
        ["updated_at", "ASC"],
      ],
    });
  }
}

export default new TournamentScoreRepository();
