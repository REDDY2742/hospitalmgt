const Joi = require('joi');
const sanitizeHtml = require('sanitize-html');

/**
 * Custom Joi Extensions for Hospital Management System
 */

const hospitalExtensions = Joi.extend(
  // 1. String Sanitization Extension (Trim & Strip HTML)
  (joi) => ({
    type: 'string',
    base: joi.string(),
    rules: {
      sanitize: {
        validate(value, helpers) {
          if (typeof value !== 'string') return value;
          const clean = sanitizeHtml(value, {
            allowedTags: [],
            allowedAttributes: {}
          });
          return clean.trim();
        }
      }
    }
  }),
  // 2. Specialized Clinical Formats
  (joi) => ({
    type: 'hospital',
    base: joi.any(),
    messages: {
      'hospital.phone': '{{#label}} must be a valid Indian or international phone number (+91...)',
      'hospital.aadhaar': '{{#label}} must be a valid 12-digit Aadhaar number',
      'hospital.bloodGroup': '{{#label}} must be a valid blood group (e.g., A+, AB-)',
      'hospital.appointmentTime': '{{#label}} must be in 24h format with 15-min intervals (e.g., 09:15, 14:45)',
      'hospital.icd10': '{{#label}} must be a valid ICD-10 diagnosis code'
    },
    rules: {
      phoneNumber: {
        validate(value, helpers) {
          const phoneRegex = /^(?:\+?\d{1,3})?[ -]?\(?[0-9]{3}\)?[ -]?[0-9]{3}[ -]?[0-9]{4}$/;
          if (!phoneRegex.test(value)) return helpers.error('hospital.phone');
          return value;
        }
      },
      aadhaarNumber: {
        validate(value, helpers) {
          const aadhaarRegex = /^\d{12}$/;
          if (!aadhaarRegex.test(value)) return helpers.error('hospital.aadhaar');
          return value;
        }
      },
      bloodGroup: {
        validate(value, helpers) {
          const bgRegex = /^(A|B|AB|O)[+-]$/;
          if (!bgRegex.test(value)) return helpers.error('hospital.bloodGroup');
          return value;
        }
      },
      appointmentTime: {
        validate(value, helpers) {
          const timeRegex = /^([01]\d|2[0-3]):(00|15|30|45)$/;
          if (!timeRegex.test(value)) return helpers.error('hospital.appointmentTime');
          return value;
        }
      },
      icd10: {
        validate(value, helpers) {
          const icdRegex = /^[A-Z][0-9][0-9](?:\.[0-9A-Z]{1,4})?$/;
          if (!icdRegex.test(value)) return helpers.error('hospital.icd10');
          return value;
        }
      }
    }
  })
);

module.exports = hospitalExtensions;
