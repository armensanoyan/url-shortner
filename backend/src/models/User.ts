import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcryptjs';

export interface UserAttributes {
  id: number;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public password!: string;
  public firstName?: string;
  public lastName?: string;
  public isActive!: boolean;
  public lastLoginAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance method to compare password
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Instance method to update last login
  public async updateLastLogin(): Promise<void> {
    this.lastLoginAt = new Date();
    await this.save();
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastLoginAt: {
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
    tableName: 'users',
    modelName: 'User',
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const saltRounds = 12;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const saltRounds = 12;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
    },
  }
);

export default User; 