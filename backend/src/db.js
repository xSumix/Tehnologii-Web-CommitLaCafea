import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || './database.sqlite',
  logging: false,
});

export const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  fullName: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM('APPLICANT', 'REVIEWER', 'ADMIN'),
    allowNull: false,
    defaultValue: 'APPLICANT',
  },
});

export const Request = sequelize.define('Request', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM('DRAFT', 'SUBMITTED', 'NEEDS_INFO', 'IN_REVIEW', 'APPROVED', 'REJECTED'),
    allowNull: false,
    defaultValue: 'DRAFT',
  },
  currentStage: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
});

export const AuditLog = sequelize.define('AuditLog', {
  action: { type: DataTypes.STRING, allowNull: false },
  previousState: { type: DataTypes.STRING, allowNull: true },
  newState: { type: DataTypes.STRING, allowNull: false },
  metadata: { type: DataTypes.JSON, allowNull: true },
});

// Relationships
User.hasMany(Request, { foreignKey: 'applicantId' });
Request.belongsTo(User, { as: 'applicant', foreignKey: 'applicantId' });

User.hasMany(Request, { foreignKey: 'assignedReviewerId' });
Request.belongsTo(User, { as: 'assignedReviewer', foreignKey: 'assignedReviewerId' });

Request.hasMany(AuditLog, { foreignKey: 'requestId' });
AuditLog.belongsTo(Request, { foreignKey: 'requestId' });

User.hasMany(AuditLog, { foreignKey: 'actorId' });
AuditLog.belongsTo(User, { as: 'actor', foreignKey: 'actorId' });