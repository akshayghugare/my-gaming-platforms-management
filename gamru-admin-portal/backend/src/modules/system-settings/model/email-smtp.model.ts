import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import sequelize from "../../../config/db";

export class EmailSmtp extends Model<
  InferAttributes<EmailSmtp>,
  InferCreationAttributes<EmailSmtp>
> {
  declare id: CreationOptional<string>;
  declare type: string;
  declare host: CreationOptional<string | null>;
  declare port: CreationOptional<number | null>;
  declare username: CreationOptional<string | null>;
  declare password: CreationOptional<string | null>;
  declare from_email: CreationOptional<string | null>;
  declare is_enabled: CreationOptional<boolean>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
}

EmailSmtp.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    host: { type: DataTypes.STRING(255), allowNull: true },
    port: { type: DataTypes.INTEGER, allowNull: true },
    username: { type: DataTypes.STRING(255), allowNull: true },
    password: { type: DataTypes.TEXT, allowNull: true },
    from_email: { type: DataTypes.STRING(255), allowNull: true },
    is_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "email_smtp",
    modelName: "EmailSmtp",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default EmailSmtp;
