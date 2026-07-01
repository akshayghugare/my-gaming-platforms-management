import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../../config/db";

/**
 * One player's participation in a mission / mission-bundle, pushed by the games
 * platform on JOIN (and updated on CLAIM). Keyed by (feature, entity_id, email)
 * so mission and bundle participation stay independent — see the 0029 migration.
 */
export class MissionParticipant extends Model<
  InferAttributes<MissionParticipant>,
  InferCreationAttributes<MissionParticipant>
> {
  declare id: CreationOptional<string>;
  /** "missions" | "mission-bundles" */
  declare feature: string;
  /** the gamification mission id OR mission-bundle id */
  declare entity_id: string;
  declare player_id: CreationOptional<string | null>;
  declare email: string;
  declare player_name: CreationOptional<string | null>;
  declare external_id: CreationOptional<string | null>;
  declare status: CreationOptional<string | null>;
  /** Player origin snapshot (GAMRU / EXTERNAL / GAMIFY / …) for display + filter. */
  declare source: CreationOptional<string | null>;

  /* Per-player progress (GAMRU is the source of truth — see migration 0031). */
  /** Current objective counter toward `target`. */
  declare progress: CreationOptional<number>;
  /** Objective target snapshot (from the mission's `data` blob at join time). */
  declare target: CreationOptional<number>;
  /** Participation TRACK: "GAMRU" (standalone) or "B<bundleId>" for a bundle. */
  declare period_key: CreationOptional<string>;
  /** Objective + display snapshot taken at join (objective_type, measure, games…). */
  declare meta: CreationOptional<Record<string, unknown> | null>;
  /** When progress first reached target. */
  declare completed_at: CreationOptional<Date | null>;
  /** When the mission reward was claimed. */
  declare claimed_at: CreationOptional<Date | null>;

  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
}

MissionParticipant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    feature: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    entity_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    player_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    player_name: {
      type: DataTypes.STRING(180),
      allowNull: true,
    },
    external_id: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    target: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    period_key: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "GAMRU",
    },
    meta: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    claimed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "mission_participants",
    modelName: "MissionParticipant",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default MissionParticipant;
