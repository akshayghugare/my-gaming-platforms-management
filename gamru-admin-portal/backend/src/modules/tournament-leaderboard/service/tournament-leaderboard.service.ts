import { playerRepository } from "../../player/model/player.repository";
import tournamentScoreRepository from "../model/tournament-score.repository";

export interface SubmitScoreInput {
  tournamentId: string;
  email: string;
  name?: string | null;
  /** Points to add to the player's running total for this tournament. */
  points: number;
}

export interface LeaderboardRow {
  rank: number;
  player_id: string | null;
  email: string;
  name: string;
  score: number;
}

/**
 * Add points to a player's tournament total (creating the row on first
 * submission). Resolves the gamru player by email so the backoffice can link
 * the standing to a known player; falls back to the email when unmapped.
 */
export const submitScore = async ({
  tournamentId,
  email,
  name,
  points,
}: SubmitScoreInput) => {
  const player = await playerRepository.findOne({ email });
  const existing = await tournamentScoreRepository.findOneFor(
    tournamentId,
    email
  );

  if (existing) {
    return existing.update({
      score: Number(existing.score ?? 0) + Number(points || 0),
      player_id: player?.id ?? existing.player_id ?? null,
      player_name: name ?? existing.player_name ?? null,
    });
  }

  return tournamentScoreRepository.create({
    tournament_id: tournamentId,
    email,
    player_id: player?.id ?? null,
    player_name: name ?? player?.name ?? null,
    score: Number(points || 0),
  });
};

export const getLeaderboard = async (
  tournamentId: string
): Promise<LeaderboardRow[]> => {
  const rows = await tournamentScoreRepository.standings(tournamentId);
  return rows.map((r, i) => ({
    rank: i + 1,
    player_id: r.player_id ?? null,
    email: r.email,
    name: (r.player_name || r.email).trim() || "Player",
    score: Number(r.score ?? 0),
  }));
};
