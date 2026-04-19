const { Model, DataTypes, Op } = require('sequelize');
const logger = require('../utils/logger.util').createChildLogger('dietary-nutrition-model');

/**
 * Hospital Management System - Dietary & Nutrition Orchestration
 * 
 * Manages institutional therapeutic diet plans, personalized clinical diet orders (IPD), 
 * and forensic meal service consumption logs for metabolic health monitoring.
 */
module.exports = (sequelize) => {
  // --- Diet Plan Model ---
  class DietPlan extends Model {}
  DietPlan.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    /** @type {string} Master Policy Code (DP-XXXXX) */
    planCode: { type: DataTypes.STRING, unique: true, field: 'plan_code' },
    name: { type: DataTypes.STRING(100), allowNull: false },
    planType: {
      type: DataTypes.ENUM('standard', 'therapeutic', 'texture_modified', 'enteral', 'parenteral', 'custom'),
      defaultValue: 'standard',
      field: 'plan_type'
    },
    therapeuticCategory: {
      type: DataTypes.ENUM('diabetic', 'cardiac', 'renal', 'hepatic', 'low_sodium', 'low_fat', 'high_protein', 'low_residue', 'gluten_free', 'lactose_free', 'post_surgical', 'oncology', 'pediatric', 'geriatric', 'weight_loss', 'weight_gain'),
      field: 'therapeutic_category'
    },
    targetCaloriesKcal: { type: DataTypes.INTEGER, field: 'target_calories_kcal' },
    targetProteinG: { type: DataTypes.DECIMAL(6, 2), field: 'target_protein_g' },
    targetCarbsG: { type: DataTypes.DECIMAL(6, 2), field: 'target_carbs_g' },
    targetFatG: { type: DataTypes.DECIMAL(6, 2), field: 'target_fat_g' },
    textureModification: {
      type: DataTypes.ENUM('regular', 'soft', 'minced', 'pureed', 'liquidized', 'thickened_nectar', 'thickened_honey', 'thickened_pudding'),
      defaultValue: 'regular',
      field: 'texture_modification'
    },
    mealSchedule: { type: DataTypes.JSON, defaultValue: {}, field: 'meal_schedule' },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
    createdBy: { type: DataTypes.UUID, field: 'created_by' }
  }, {
    sequelize,
    modelName: 'DietPlan',
    tableName: 'diet_plans',
    underscored: true,
    paranoid: true,
    hooks: {
      beforeCreate: (dp) => {
        dp.planCode = `DP-${Math.random().toString(36).substring(7).toUpperCase()}`;
      }
    }
  });

  // --- Diet Order Model ---
  class DietOrder extends Model {
    /**
     * @description Clinical modification of an active diet order
     */
    async modify(changes, changedBy, reason) {
      const history = [...(this.modificationHistory || [])];
      history.push({ date: new Date(), changedBy, changes, reason });
      return this.update({ ...changes, modificationHistory: history, status: 'modified' });
    }
  }

  DietOrder.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderNumber: { type: DataTypes.STRING, unique: true, field: 'order_number' },
    patientId: { type: DataTypes.UUID, allowNull: false, field: 'patient_id' },
    admissionId: { type: DataTypes.UUID, field: 'admission_id' },
    dietPlanId: { type: DataTypes.UUID, field: 'diet_plan_id' },
    orderedBy: { type: DataTypes.UUID, field: 'ordered_by' },
    status: {
      type: DataTypes.ENUM('active', 'modified', 'discontinued', 'completed', 'on_hold'),
      defaultValue: 'active'
    },
    isNPO: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_npo', comment: 'Nil Per Oral' },
    npoReason: { type: DataTypes.TEXT, field: 'npo_reason' },
    startDate: { type: DataTypes.DATEONLY, field: 'start_date' },
    // --- Nutritional Constraints ---
    allergies: { type: DataTypes.JSON, defaultValue: [], comment: 'Critical food allergy flags for kitchen' },
    religiousRestrictions: { type: DataTypes.JSON, defaultValue: [], field: 'religious_restrictions' },
    fluidRestriction: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'fluid_restriction' },
    maxFluidMl: { type: DataTypes.INTEGER, field: 'max_fluid_ml' },
    nutritionRiskLevel: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'low', field: 'nutrition_risk_level' },
    modificationHistory: { type: DataTypes.JSON, defaultValue: [], field: 'modification_history' }
  }, {
    sequelize,
    modelName: 'DietOrder',
    tableName: 'diet_orders',
    underscored: true,
    paranoid: true,
    hooks: {
      beforeCreate: (do_obj) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        do_obj.orderNumber = `DO-${dateStr}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      },
      afterCreate: (do_obj) => {
        if (do_obj.isNPO) {
           logger.warn(`CRITICAL_DIET_ALERT: Patient ${do_obj.patientId} placed on NPO. Nursing staff notified.`);
        }
        // Emit for kitchen production kitchen dashboard
        try {
           const { getIO } = require('../config/socket');
           getIO().of('/dietary').emit('dietOrder:new', do_obj);
        } catch (e) {}
      }
    }
  });

  // --- Meal Service Model ---
  class MealService extends Model {
    /** @type {number} Virtual: totalServed * percentage/100 */
    get totalCaloriesConsumed() {
      return (Number(this.totalCaloriesServed || 0) * Number(this.consumptionPercentage || 0)) / 100;
    }
  }

  MealService.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    serviceId: { type: DataTypes.STRING, unique: true, field: 'service_id' },
    dietOrderId: { type: DataTypes.UUID, allowNull: false, field: 'diet_order_id' },
    patientId: { type: DataTypes.UUID, field: 'patient_id' },
    admissionId: { type: DataTypes.UUID, field: 'admission_id' },
    wardId: { type: DataTypes.UUID, field: 'ward_id' },
    mealType: {
      type: DataTypes.ENUM('early_morning_tea', 'breakfast', 'mid_morning', 'lunch', 'evening_tea', 'dinner', 'late_night', 'supplement', 'enteral_feed', 'special'),
      field: 'meal_type'
    },
    scheduledTime: { type: DataTypes.DATE, field: 'scheduled_time' },
    actualServedTime: { type: DataTypes.DATE, field: 'actual_served_time' },
    status: {
      type: DataTypes.ENUM('scheduled', 'prepared', 'dispatched', 'delivered', 'consumed', 'partially_consumed', 'refused', 'patient_absent', 'missed', 'cancelled'),
      defaultValue: 'scheduled'
    },
    consumptionPercentage: { type: DataTypes.INTEGER, defaultValue: 0, field: 'consumption_percentage' },
    refusalReason: {
      type: DataTypes.ENUM('nausea', 'vomiting', 'loss_of_appetite', 'not_liked', 'too_much', 'religious', 'npo_order', 'procedureScheduled'),
      field: 'refusal_reason'
    },
    totalCaloriesServed: { type: DataTypes.DECIMAL(8, 2), field: 'total_calories_served' },
    deliveredBy: { type: DataTypes.UUID, field: 'delivered_by' },
    observedBy: { type: DataTypes.UUID, field: 'observed_by', comment: 'Nurse who verified consumption' }
  }, {
    sequelize,
    modelName: 'MealService',
    tableName: 'meal_services',
    underscored: true,
    hooks: {
      beforeCreate: (ms) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        ms.serviceId = `MS-${dateStr}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      },
      afterUpdate: (ms) => {
        if (ms.changed('status') && ms.status === 'refused') {
           logger.warn(`DIET_COMPLIANCE_ALERT: Patient ${ms.patientId} refused ${ms.mealType}. Reason: ${ms.refusalReason}`);
        }
      }
    }
  });

  // --- Associations ---
  DietPlan.associate = (models) => {
    DietPlan.hasMany(models.DietOrder, { foreignKey: 'dietPlanId', as: 'appliedOrders' });
  };

  DietOrder.associate = (models) => {
    DietOrder.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    DietOrder.belongsTo(models.Admission, { foreignKey: 'admissionId', as: 'admissionContext' });
    DietOrder.belongsTo(models.DietPlan, { foreignKey: 'dietPlanId', as: 'assignedPlan' });
    DietOrder.hasMany(models.MealService, { foreignKey: 'dietOrderId', as: 'meals' });
  };

  MealService.associate = (models) => {
    MealService.belongsTo(models.DietOrder, { foreignKey: 'dietOrderId', as: 'parentOrder' });
    MealService.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    MealService.belongsTo(models.Ward, { foreignKey: 'wardId', as: 'ward' });
  };

  return { DietPlan, DietOrder, MealService };
};
