import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../../config/db";

/**
 * One player's standing in one tournament. Tournaments are authored in the
 * gamification `tournaments` table; the actual gameplay happens on the games
 * platform, which pushes scores here (clientAuth) so the backoffice can show
 * the same leaderboard the players see.
 */
export class TournamentScore extends Model<
  InferAttributes<TournamentScore>,
  InferCreationAttributes<TournamentScore>
> {
  declare id: CreationOptional<string>;
  declare tournament_id: string;
  declare player_id: CreationOptional<string | null>;
  declare email: string;
  declare player_name: CreationOptional<string | null>;
  declare score: CreationOptional<number>;

  /* Participation + progress (GAMRU is the source of truth — migration 0032). */
  /** Total plays counted toward this tournament. */
  declare plays: CreationOptional<number>;
  /** { [gameKey]: count } play breakdown. */
  declare games_played: CreationOptional<Record<string, number>>;
  /** The player explicitly joined / registered. */
  declare registered: CreationOptional<boolean>;
  /** Opt-in flag (paid / buy-in tournaments). */
  declare opted_in: CreationOptional<boolean>;
  /** Last computed leaderboard rank (1-based); null until ranked. */
  declare rank: CreationOptional<number | null>;
  /** The player's settled prize share. */
  declare prize_amount: CreationOptional<number>;
  /** Settlement guard — a winner's reward was granted exactly once. */
  declare prize_awarded: CreationOptional<boolean>;
  /** When the player claimed the prize reward. */
  declare claimed_at: CreationOptional<Date | null>;
  /** The IN_PROGRESS player_reward created for this winner at settlement. */
  declare reward_id: CreationOptional<string | null>;
  /** REGISTERED | RANKED | WON | CLAIMED (latest known). */
  declare status: CreationOptional<string | null>;

  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
}

TournamentScore.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tournament_id: { type: DataTypes.UUID, allowNull: false },
    player_id: { type: DataTypes.UUID, allowNull: true },
    email: { type: DataTypes.STRING(180), allowNull: false },
    player_name: { type: DataTypes.STRING(180), allowNull: true },
    score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    plays: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    games_played: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    registered: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    opted_in: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    rank: { type: DataTypes.INTEGER, allowNull: true },
    prize_amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    prize_awarded: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    claimed_at: { type: DataTypes.DATE, allowNull: true },
    reward_id: { type: DataTypes.UUID, allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "tournament_scores",
    modelName: "TournamentScore",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { unique: true, fields: ["tournament_id", "email"] },
      { fields: ["tournament_id"] },
    ],
  }
);

export default TournamentScore;
