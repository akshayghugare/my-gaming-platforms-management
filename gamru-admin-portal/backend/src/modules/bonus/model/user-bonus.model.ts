import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../../config/db";

/**
 * A row per bonus a player CLAIMED on SDLCGames, mirrored into GAMRU. `user_id`
 * is the games-platform user id; `email` resolves the GAMRU player. `source`
 * records the origin system. This is a ledger/audit mirror — the wallet credit
 * itself stays on SDLCGames.
 */
export class UserBonus extends Model<
  InferAttributes<UserBonus>,
  InferCreationAttributes<UserBonus>
> {
  declare id: CreationOptional<string>;
  declare user_id: string;
  declare email: CreationOptional<string | null>;
  declare external_bonus_id: string;
  declare bonus_name: CreationOptional<string>;
  declare source_type: string;
  declare source_id: CreationOptional<string>;
  declare amount: CreationOptional<number>;
  declare amount_type: CreationOptional<string>;
  declare status: CreationOptional<string>;
  declare source: CreationOptional<string>;
  declare claimed_at: CreationOptional<Date | null>;

  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
}

UserBonus.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(180), allowNull: true },
    external_bonus_id: { type: DataTypes.STRING(64), allowNull: false },
    bonus_name: { type: DataTypes.STRING(150), allowNull: false, defaultValue: "" },
    source_type: { type: DataTypes.STRING(16), allowNull: false },
    source_id: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "" },
    amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    amount_type: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "RM" },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "CLAIMED" },
    source: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "SDLCGAMES" },
    claimed_at: { type: DataTypes.DATE, allowNull: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "user_bonuses",
    modelName: "UserBonus",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ fields: ["user_id"] }, { fields: ["external_bonus_id"] }],
  }
);

export default UserBonus;
