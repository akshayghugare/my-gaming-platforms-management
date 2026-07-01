import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../../config/db";

export type WidgetConfigStatus = "ACTIVE" | "INACTIVE";

export class WidgetConfiguration extends Model<
  InferAttributes<WidgetConfiguration>,
  InferCreationAttributes<WidgetConfiguration>
> {
  declare id: CreationOptional<string>;
  declare client_id: string;
  declare name: string;
  declare type: string;
  declare allowed_domains: CreationOptional<string[] | null>;
  declare status: CreationOptional<WidgetConfigStatus>;
  declare expiry_date: CreationOptional<Date | null>;
  declare appearance: CreationOptional<Record<string, unknown> | null>;

  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
}

WidgetConfiguration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    allowed_domains: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    appearance: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "widget_configurations",
    modelName: "WidgetConfiguration",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default WidgetConfiguration;
