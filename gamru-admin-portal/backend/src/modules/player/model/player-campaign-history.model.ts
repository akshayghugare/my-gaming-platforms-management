import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../../config/db";

export type CampaignChannel =
  | "WEB_PUSH"
  | "ON_SITE"
  | "EMAIL"
  | "SMS"
  | "PUSH";

export type CampaignDeliveryStatus =
  | "SENT"
  | "OPEN"
  | "ERROR"
  | "CLICKED"
  | "PENDING";

/**
 * One delivered (or attempted) campaign message to a single player — powers
 * both the operator "Campaign History" tab timeline AND the player-facing
 * on-site INBOX. `body` is the rendered message the player reads; `read_at`
 * is stamped the first time they open it.
 */
export class PlayerCampaignHistory extends Model<
  InferAttributes<PlayerCampaignHistory>,
  InferCreationAttributes<PlayerCampaignHistory>
> {
  declare id: CreationOptional<string>;
  declare player_id: string;
  declare campaign_id: CreationOptional<string | null>;
  declare channel: CampaignChannel;
  declare title: string;
  declare body: CreationOptional<string | null>;
  declare status: CampaignDeliveryStatus;
  declare event_label: CreationOptional<string | null>;
  declare event_at: Date;
  declare read_at: CreationOptional<Date | null>;

  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
}

PlayerCampaignHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    player_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    campaign_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    channel: {
      type: DataTypes.ENUM("WEB_PUSH", "ON_SITE", "EMAIL", "SMS", "PUSH"),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("SENT", "OPEN", "ERROR", "CLICKED", "PENDING"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    event_label: {
      type: DataTypes.STRING(180),
      allowNull: true,
    },
    event_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "player_campaign_history",
    modelName: "PlayerCampaignHistory",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default PlayerCampaignHistory;
