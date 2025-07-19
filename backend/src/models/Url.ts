import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import User from './User';

export interface UrlAttributes {
  id: number;
  slug: string;
  originalUrl: string;
  title?: string;
  description?: string;
  userId?: number;
  isActive: boolean;
  visitCount: number;
  lastVisitedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UrlCreationAttributes extends Optional<UrlAttributes, 'id' | 'isActive' | 'visitCount' | 'createdAt' | 'updatedAt'> {}

class Url extends Model<UrlAttributes, UrlCreationAttributes> implements UrlAttributes {
  public id!: number;
  public slug!: string;
  public originalUrl!: string;
  public title?: string;
  public description?: string;
  public userId?: number;
  public isActive!: boolean;
  public visitCount!: number;
  public lastVisitedAt?: Date;
  public expiresAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance method to increment visit count
  public async incrementVisitCount(): Promise<void> {
    this.visitCount += 1;
    this.lastVisitedAt = new Date();
    await this.save();
  }

  // Instance method to check if URL is expired
  public isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }
}

Url.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    originalUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'originalUrl',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    visitCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lastVisitedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'urls',
    modelName: 'Url',
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['isActive'],
      },
    ],
  }
);

// Define associations
Url.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(Url, {
  foreignKey: 'userId',
  as: 'urls',
});

export default Url; 