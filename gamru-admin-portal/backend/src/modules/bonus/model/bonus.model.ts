import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../../config/db";

/**
 * A SNAPSHOT of an SDLCGames bonus definition, synced into GAMRU when a rank
 * pins its `external_bonus_id`. `source` records the origin system. GAMRU never
 * owns these — they are a read-mirror so operators can see what a rank grants.
 */
export class Bonus extends Model<
  InferAttributes<Bonus>,
  InferCreationAttributes<Bonus>
> {
  declare id: CreationOptional<string>;
  declare external_bonus_id: string;
  declare bonus_name: string;
  declare bonus_type: CreationOptional<string>;
  declare amount: CreationOptional<number>;
  declare amount_type: CreationOptional<string>;
  declare status: CreationOptional<string>;
  declare source: CreationOptional<string>;
  declare synced_at: CreationOptional<Date | null>;

  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
}

Bonus.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    external_bonus_id: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    bonus_name: { type: DataTypes.STRING(150), allowNull: false },
    bonus_type: { type: DataTypes.STRING(60), allowNull: false, defaultValue: "BONUS_CASH" },
    amount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    amount_type: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "RM" },
    status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: "ACTIVE" },
    source: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "SDLCGAMES" },
    synced_at: { type: DataTypes.DATE, allowNull: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "bonuses",
    modelName: "Bonus",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Bonus;
