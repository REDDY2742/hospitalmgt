/**
 * @file dateTime.util.js
 * @description Comprehensive date and time utility for a multi-timezone Hospital Management System.
 * Built with date-fns and date-fns-tz.
 * 
 * Includes clinical, financial (Indian FY), and scheduling utilities.
 * 
 * @author Hospital Management Suite Backend Team
 * @version 2.0.0
 */

const { 
  format: fnsFormat, 
  parse, 
  parseISO: fnsParseISO, 
  isValid: fnsIsValid, 
  add, 
  sub, 
  differenceInYears, 
  differenceInMonths, 
  differenceInDays, 
  differenceInHours,
  differenceInMinutes, 
  differenceInSeconds,
  startOfDay: fnsStartOfDay, 
  endOfDay: fnsEndOfDay,
  startOfWeek: fnsStartOfWeek,
  endOfWeek: fnsEndOfWeek,
  startOfMonth: fnsStartOfMonth,
  endOfMonth: fnsEndOfDayOfMonth,
  startOfYear: fnsStartOfYear,
  endOfYear: fnsEndOfYear,
  isSameDay: fnsIsSameDay,
  isToday: fnsIsToday,
  isTomorrow: fnsIsTomorrow,
  isYesterday: fnsIsYesterday,
  isWeekend: fnsIsWeekend,
  isPast: fnsIsPast,
  isFuture: fnsIsFuture,
  isAfter,
  isBefore,
  addMinutes,
  eachDayOfInterval,
  getQuarter,
  getYear,
  getMonth,
  getDate,
  getHours,
  getMinutes,
  getSeconds,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  isLeapYear: fnsIsLeapYear,
  getDaysInMonth: fnsGetDaysInMonth,
  differenceInCalendarDays,
  roundToNearestMinutes,
  formatDistance,
  formatDistanceToNow
} = require('date-fns');
const { 
  formatInTimeZone: fnsFormatInTimeZone, 
  utcToZonedTime, 
  zonedTimeToUtc,
  getTimezoneOffset: fnsGetTimezoneOffset
} = require('date-fns-tz');
const { enIN, hi } = require('date-fns/locale');

// --- CONSTANTS ---

const DEFAULT_TIMEZONE = process.env.HOSPITAL_TIMEZONE || 'Asia/Kolkata';
const DEFAULT_LOCALE = process.env.HOSPITAL_LOCALE || 'en-IN';
const FINANCIAL_YEAR_START_MONTH = 4; // April
const WEEK_START_DAY = 1; // Monday

const TIMEZONES = {
  INDIA: 'Asia/Kolkata',
  UTC: 'UTC',
  NEW_YORK: 'America/New_York',
  LONDON: 'Europe/London',
  DUBAI: 'Asia/Dubai',
  SINGAPORE: 'Asia/Singapore'
};

const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  SHORT: 'dd/MM/yyyy',
  LONG: 'EEEE, dd MMMM yyyy',
  MEDIUM: 'dd-MMM-yyyy',
  ISO_DATE: 'yyyy-MM-dd',
  DATETIME: 'dd MMM yyyy, hh:mm a',
  DATETIME_LONG: 'EEEE, dd MMMM yyyy \'at\' hh:mm a zzz',
  TIME_12: 'hh:mm a',
  TIME_24: 'HH:mm',
  TIME_SECONDS: 'HH:mm:ss',
  MONTH_YEAR: 'MMMM yyyy',
  MONTH_SHORT: 'MMM yyyy',
  DB_DATE: 'yyyy-MM-dd',
  DB_DATETIME: 'yyyy-MM-dd HH:mm:ss'
};

const VITAL_THRESHOLDS = {
  temperature: { critical_low: 35, low: 36, normal_max: 37.5, fever: 38, high: 39, critical_high: 40 },
  pulse: { critical_low: 40, bradycardia: 60, normal_max: 100, tachycardia: 150, critical_high: 180 },
  spo2: { critical: 80, severe: 85, moderate: 90, mild: 94, normal: 95 },
  bp_systolic: { critical_low: 80, low: 90, elevated: 120, stage1: 130, stage2: 140, crisis: 180 },
  gcs: { severe: 8, moderate: 12, mild: 13, normal: 15 },
  glucose: { critical_low: 40, low: 70, normal_max: 100, pre_diabetic: 126, diabetic: 200, critical_high: 400 }
};

// --- HELPER WRAPPERS ---

/**
 * Ensures input is a valid Date object or null.
 * @param {Date|string|number} date 
 * @returns {Date|null}
 */
const toDate = (date) => {
  if (date === null || date === undefined) return null;
  const d = new Date(date);
  return fnsIsValid(d) ? d : null;
};

// --- 1. DATE FORMATTING FUNCTIONS ---

/**
 * Format a date into a string based on preset or custom pattern.
 * @param {Date|string|number} date 
 * @param {string} formatPattern Preset name or date-fns pattern
 * @param {string} timezone Defaults to hospital timezone
 * @returns {string}
 */
const formatDate = (date, formatPattern = 'display', timezone = DEFAULT_TIMEZONE) => {
  const d = toDate(date);
  if (!d) return 'N/A';

  const pattern = DATE_FORMATS[formatPattern.toUpperCase()] || formatPattern;
  
  try {
    return fnsFormatInTimeZone(d, timezone, pattern, { locale: enIN });
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Shortcut for datetime formatting with timezone abbreviation.
 */
const formatDateTime = (date, timezone = DEFAULT_TIMEZONE) => {
  return formatDate(date, 'datetime', timezone);
};

/**
 * Format time component only.
 */
const formatTime = (date, use24Hour = false, timezone = DEFAULT_TIMEZONE) => {
  return formatDate(date, use24Hour ? 'TIME_24' : 'TIME_12', timezone);
};

const formatTimeRange = (startDate, endDate, timezone = DEFAULT_TIMEZONE) => {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end) return 'N/A';

  const sTime = formatTime(start, false, timezone);
  const eTime = formatTime(end, false, timezone);

  if (!fnsIsSameDay(utcToZonedTime(start, timezone), utcToZonedTime(end, timezone))) {
    return `${sTime} – ${eTime} (${formatDate(end, 'short', timezone)})`;
  }
  return `${sTime} – ${eTime}`;
};

const formatDateRange = (startDate, endDate, formatStr = 'display', timezone = DEFAULT_TIMEZONE) => {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end) return 'N/A';

  const sZoned = utcToZonedTime(start, timezone);
  const eZoned = utcToZonedTime(end, timezone);

  if (fnsIsSameDay(sZoned, eZoned)) return formatDate(start, formatStr, timezone);
  
  const sMonth = getMonth(sZoned);
  const eMonth = getMonth(eZoned);
  const sYear = getYear(sZoned);
  const eYear = getYear(eZoned);

  if (sYear === eYear && sMonth === eMonth) {
    return `${formatInTimezone(start, 'dd', timezone)} – ${formatDate(end, 'display', timezone)}`;
  }
  if (sYear === eYear) {
    return `${formatInTimezone(start, 'dd MMM', timezone)} – ${formatDate(end, 'display', timezone)}`;
  }
  return `${formatDate(start, 'display', timezone)} – ${formatDate(end, 'display', timezone)}`;
};

const formatDuration = (minutes, format = 'short') => {
  if (isNaN(minutes)) return '0m';
  const totalSeconds = Math.floor(minutes * 60);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (format === 'clock') {
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  if (format === 'long') {
    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (mins > 0) parts.push(`${mins} minute${mins > 1 ? 's' : ''}`);
    return parts.join(' ') || '0 minutes';
  }

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  return parts.join(' ') || '0m';
};

const formatAge = (dateOfBirth, referenceDate = new Date()) => {
  const dob = toDate(dateOfBirth);
  const ref = toDate(referenceDate);
  if (!dob) return { years: 0, months: 0, days: 0, formatted: 'N/A', formattedShort: 'N/A' };

  const years = differenceInYears(ref, dob);
  const months = differenceInMonths(ref, dob) % 12;
  const days = differenceInDays(ref, add(dob, { years, months }));

  let formatted = '';
  let formattedShort = '';

  if (years >= 2) {
    formatted = `${years} years ${months} months`;
    formattedShort = `${years}Y ${months}M`;
  } else if (years > 0) {
    formatted = `${years} year ${months} months`;
    formattedShort = `${years}Y ${months}M`;
  } else if (months > 0) {
    formatted = `${months} months ${days} days`;
    formattedShort = `${months}M ${days}D`;
  } else {
    formatted = `${days} days`;
    formattedShort = `${days}D`;
  }

  return { years, months, days, formatted, formattedShort };
};

const formatRelativeTime = (date, baseDate = new Date(), addSuffix = true) => {
  const d = toDate(date);
  if (!d) return 'N/A';
  return formatDistance(d, baseDate, { addSuffix, locale: enIN });
};

const formatCurrency = (amount, currency = 'INR', locale = 'en-IN') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol'
  }).format(amount || 0);
};

const formatIndianNumber = (number, decimals = 2) => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number || 0);
};

// --- 2. DATE PARSING FUNCTIONS ---

const parseDate = (dateString, formatsArray = null) => {
  if (!dateString) return null;
  const standardFormats = [
    'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 
    'dd-MM-yyyy', 'dd MMM yyyy', 'MMM dd yyyy',
    'yyyyMMdd', 'dd.MM.yyyy'
  ];
  const formatsToTry = formatsArray || standardFormats;

  // Try ISO parsing first
  const isoDate = fnsParseISO(dateString);
  if (fnsIsValid(isoDate)) return isoDate;

  for (const fmt of formatsToTry) {
    const parsed = parse(dateString, fmt, new Date());
    if (fnsIsValid(parsed)) return parsed;
  }

  return null;
};

const parseDateTime = (dateTimeString, timezone = DEFAULT_TIMEZONE) => {
  const d = parseDate(dateTimeString);
  if (!d) return null;
  return zonedTimeToUtc(d, timezone);
};

const parseTime = (timeString) => {
  if (!timeString) return { hours: 0, minutes: 0, seconds: 0 };
  const d = parseDate(timeString, ['hh:mm a', 'HH:mm', 'hh:mm:ss a', 'HH:mm:ss']);
  if (!d) return { hours: 0, minutes: 0, seconds: 0 };
  return {
    hours: getHours(d),
    minutes: getMinutes(d),
    seconds: getSeconds(d)
  };
};

const parseDuration = (durationString) => {
  if (!durationString) return { hours: 0, minutes: 0, seconds: 0, totalMinutes: 0 };
  // Handle '2h 30m', '90m', '1:30'
  let hours = 0, minutes = 0;
  
  if (durationString.includes(':')) {
    const parts = durationString.split(':');
    hours = parseInt(parts[0]) || 0;
    minutes = parseInt(parts[1]) || 0;
  } else {
    const hMatch = durationString.match(/(\d+)\s*(h|hour)/);
    const mMatch = durationString.match(/(\d+)\s*(m|min)/);
    if (hMatch) hours = parseInt(hMatch[1]);
    if (mMatch) minutes = parseInt(mMatch[1]);
    if (!hMatch && !mMatch) minutes = parseInt(durationString) || 0;
  }

  return {
    hours,
    minutes,
    seconds: 0,
    totalMinutes: (hours * 60) + minutes,
    totalSeconds: (hours * 3600) + (minutes * 60)
  };
};

const parseISO = (isoString) => {
  const d = fnsParseISO(isoString);
  return fnsIsValid(d) ? d : null;
};

const fromTimestamp = (timestamp) => {
  if (!timestamp) return null;
  const ts = Number(timestamp);
  const d = new Date(ts > 1e11 ? ts : ts * 1000);
  return fnsIsValid(d) ? d : null;
};

// --- 3. DATE CALCULATION FUNCTIONS ---

const calculateAge = (dateOfBirth, referenceDate = new Date()) => {
  const dob = toDate(dateOfBirth);
  const ref = toDate(referenceDate);
  if (!dob) return null;

  const years = differenceInYears(ref, dob);
  const months = differenceInMonths(ref, dob) % 12;
  const days = differenceInDays(ref, add(dob, { years, months }));
  const totalDays = differenceInDays(ref, dob);
  const totalMonths = differenceInMonths(ref, dob);

  return {
    years,
    months,
    days,
    totalDays,
    totalMonths,
    isMinor: years < 18,
    isSeniorCitizen: years >= 60,
    formatted: `${years} years ${months} months ${days} days`,
    formattedShort: `${years}Y ${months}M`
  };
};

const calculateDuration = (startDate, endDate) => {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end) return null;

  const totalMinutes = Math.abs(differenceInMinutes(end, start));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return {
    totalMinutes,
    totalHours: totalMinutes / 60,
    totalDays: totalMinutes / (24 * 60),
    days,
    hours,
    minutes,
    formatted: formatDuration(totalMinutes, 'long')
  };
};

const calculateLengthOfStay = (admissionDate, dischargeDate) => {
  const start = toDate(admissionDate);
  const end = toDate(dischargeDate) || new Date();
  if (!start) return null;

  const totalHours = Math.abs(differenceInHours(end, start));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  // Chargeable days logic: Admission day counts, Discharge day doesn't (standard hospital logic)
  const chargeableDays = Math.max(1, differenceInCalendarDays(end, start));

  return {
    days,
    hours,
    totalHours,
    formatted: `${days} days ${hours} hours`,
    chargeableDays
  };
};

const addTime = (date, amount, unit = 'days') => {
  const d = toDate(date);
  if (!d) return null;
  const options = { [unit]: amount };
  return add(d, options);
};

const subtractTime = (date, amount, unit = 'days') => {
  const d = toDate(date);
  if (!d) return null;
  const options = { [unit]: amount };
  return sub(d, options);
};

const differenceInWorkingDays = (startDate, endDate, holidayList = []) => {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end) return 0;

  const interval = eachDayOfInterval({ start, end });
  let count = 0;
  for (const day of interval) {
    if (!fnsIsWeekend(day) && !isHoliday(day, holidayList)) {
      count++;
    }
  }
  return count;
};

const calculateLeavedays = (fromDate, toDate, leaveType = 'full', holidayList = []) => {
  const start = fnsStartOfDay(toDate(fromDate));
  const end = fnsEndOfDay(toDate(toDate));
  if (!start || !end) return null;

  const interval = eachDayOfInterval({ start, end });
  let workingDays = 0, weekendDays = 0, holidayDays = 0;

  for (const day of interval) {
    if (fnsIsWeekend(day)) weekendDays++;
    else if (isHoliday(day, holidayList)) holidayDays++;
    else workingDays++;
  }

  const factor = leaveType === 'half' ? 0.5 : 1.0;
  return {
    totalCalendarDays: interval.length,
    workingDays,
    weekendDays,
    holidayDays,
    chargeableDays: workingDays * factor
  };
};

const calculateOvertimeHours = (scheduledEnd, actualEnd, graceMinutes = 15) => {
  const sch = toDate(scheduledEnd);
  const act = toDate(actualEnd);
  if (!sch || !act || act <= sch) return { overtimeMinutes: 0, overtimeHours: 0 };

  const diff = differenceInMinutes(act, sch);
  if (diff <= graceMinutes) return { overtimeMinutes: 0, overtimeHours: 0 };

  const overtime = diff - graceMinutes;
  return {
    overtimeMinutes: overtime,
    overtimeHours: parseFloat((overtime / 60).toFixed(2))
  };
};

const calculateShiftDuration = (shiftStart, shiftEnd, breakMinutes = 0) => {
  let start = toDate(shiftStart);
  let end = toDate(shiftEnd);
  if (!start || !end) return null;

  // Handle cross-midnight if end is before start
  if (end < start) end = add(end, { days: 1 });

  const grossMinutes = differenceInMinutes(end, start);
  const netMinutes = grossMinutes - breakMinutes;

  return {
    grossMinutes,
    grossHours: grossMinutes / 60,
    netMinutes,
    netHours: netMinutes / 60,
    crossesMidnight: end.getDate() !== start.getDate(),
    formatted: formatDuration(netMinutes, 'short')
  };
};

// --- 4. DATE BOUNDARY FUNCTIONS ---

const startOfDay = (date, timezone = DEFAULT_TIMEZONE) => {
  const d = toDate(date);
  if (!d) return null;
  const zoned = utcToZonedTime(d, timezone);
  const start = fnsStartOfDay(zoned);
  return zonedTimeToUtc(start, timezone);
};

const endOfDay = (date, timezone = DEFAULT_TIMEZONE) => {
  const d = toDate(date);
  if (!d) return null;
  const zoned = utcToZonedTime(d, timezone);
  const end = fnsEndOfDay(zoned);
  return zonedTimeToUtc(end, timezone);
};

const startOfWeek = (date, timezone = DEFAULT_TIMEZONE) => {
  const d = toDate(date);
  if (!d) return null;
  const zoned = utcToZonedTime(d, timezone);
  const start = fnsStartOfWeek(zoned, { weekStartsOn: WEEK_START_DAY });
  return zonedTimeToUtc(start, timezone);
};

const endOfWeek = (date, timezone = DEFAULT_TIMEZONE) => {
  const d = toDate(date);
  if (!d) return null;
  const zoned = utcToZonedTime(d, timezone);
  const end = fnsEndOfWeek(zoned, { weekStartsOn: WEEK_START_DAY });
  return zonedTimeToUtc(end, timezone);
};

const startOfMonth = (date, timezone = DEFAULT_TIMEZONE) => {
  const d = toDate(date);
  if (!d) return null;
  const zoned = utcToZonedTime(d, timezone);
  const start = fnsStartOfMonth(zoned);
  return zonedTimeToUtc(start, timezone);
};

const endOfMonth = (date, timezone = DEFAULT_TIMEZONE) => {
  const d = toDate(date);
  if (!d) return null;
  const zoned = utcToZonedTime(d, timezone);
  const end = fnsEndOfDayOfMonth(zoned);
  return zonedTimeToUtc(end, timezone);
};

const startOfYear = (date, timezone = DEFAULT_TIMEZONE) => {
  const d = toDate(date);
  if (!d) return null;
  const zoned = utcToZonedTime(d, timezone);
  const start = fnsStartOfYear(zoned);
  return zonedTimeToUtc(start, timezone);
};

const endOfYear = (date, timezone = DEFAULT_TIMEZONE) => {
  const d = toDate(date);
  if (!d) return null;
  const zoned = utcToZonedTime(d, timezone);
  const end = fnsEndOfYear(zoned);
  return zonedTimeToUtc(end, timezone);
};

// --- 5. FINANCIAL YEAR (India) ---

const getFinancialYear = (date = new Date()) => {
  const d = toDate(date);
  const month = getMonth(d) + 1;
  const year = getYear(d);

  const startYear = (month < FINANCIAL_YEAR_START_MONTH) ? year - 1 : year;
  const endYear = startYear + 1;

  const startDate = zonedTimeToUtc(`${startYear}-04-01 00:00:00`, DEFAULT_TIMEZONE);
  const endDate = zonedTimeToUtc(`${endYear}-03-31 23:59:59.999`, DEFAULT_TIMEZONE);

  const q = getFinancialQuarter(d).quarter;

  return {
    startYear,
    endYear,
    label: `FY ${startYear}-${String(endYear).slice(-2)}`,
    startDate,
    endDate,
    quarter: q,
    monthInFY: (month >= FINANCIAL_YEAR_START_MONTH) ? (month - FINANCIAL_YEAR_START_MONTH + 1) : (month + 12 - FINANCIAL_YEAR_START_MONTH + 1)
  };
};

const startOfFinancialYear = (year) => {
  return zonedTimeToUtc(`${year}-04-01 00:00:00`, DEFAULT_TIMEZONE);
};

const endOfFinancialYear = (year) => {
  return zonedTimeToUtc(`${year + 1}-03-31 23:59:59.999`, DEFAULT_TIMEZONE);
};

const getFinancialQuarter = (date) => {
  const d = toDate(date);
  const m = getMonth(d) + 1;
  let q, labelPrefix;

  if (m >= 4 && m <= 6) q = 'Q1';
  else if (m >= 7 && m <= 9) q = 'Q2';
  else if (m >= 10 && m <= 12) q = 'Q3';
  else q = 'Q4';

  const fy = getFinancialYear(d);
  return {
    quarter: q,
    label: `${q} ${fy.label}`,
    startDate: startOfFinancialQuarter(d),
    endDate: endOfFinancialQuarter(d)
  };
};

const startOfFinancialQuarter = (date) => {
  const d = toDate(date);
  const m = getMonth(d) + 1;
  const y = getYear(d);
  let startMonth;
  if (m >= 4 && m <= 6) startMonth = 4;
  else if (m >= 7 && m <= 9) startMonth = 7;
  else if (m >= 10 && m <= 12) startMonth = 10;
  else startMonth = 1;

  return zonedTimeToUtc(`${y}-${String(startMonth).padStart(2, '0')}-01 00:00:00`, DEFAULT_TIMEZONE);
};

const endOfFinancialQuarter = (date) => {
  const start = startOfFinancialQuarter(date);
  const end = add(start, { months: 3 });
  return sub(end, { seconds: 1 });
};

// --- 6. SHIFT AND SCHEDULE UTILITIES ---

const getShiftForTime = (time, shiftDefinitions) => {
  const d = toDate(time);
  const tStr = formatDate(d, 'TIME_24');
  
  for (const shift of shiftDefinitions) {
    if (isWithinShift(tStr, shift.start, shift.end)) {
      return shift;
    }
  }
  return null;
};

const isWithinShift = (timeStr, shiftStart, shiftEnd) => {
  if (shiftEnd > shiftStart) {
    return timeStr >= shiftStart && timeStr <= shiftEnd;
  }
  // Cross-midnight
  return timeStr >= shiftStart || timeStr <= shiftEnd;
};

const generateTimeSlots = (startTimeStr, endTimeStr, slotDuration) => {
  const slots = [];
  let current = parse(startTimeStr, 'HH:mm', new Date());
  const end = parse(endTimeStr, 'HH:mm', new Date());

  if (end < current) { // Cross midnight
    // Implementation for cross-midnight can be complex, usually hospital OPDs don't cross midnight
    // but ER shifts might. For OPD slots, we assume same day.
  }

  while (current < end) {
    const slotEnd = add(current, { minutes: slotDuration });
    if (slotEnd > end) break;
    slots.push({
      startTime: fnsFormat(current, 'HH:mm'),
      endTime: fnsFormat(slotEnd, 'HH:mm'),
      isAvailable: true
    });
    current = slotEnd;
  }
  return slots;
};

const hasTimeConflict = (existingSlots, newStart, newEnd) => {
  const nStart = toDate(newStart);
  const nEnd = toDate(newEnd);

  for (const slot of existingSlots) {
    const sStart = toDate(slot.startTime);
    const sEnd = toDate(slot.endTime);
    // Overlap condition: startA < endB && endA > startB
    if (nStart < sEnd && nEnd > sStart) {
      return { hasConflict: true, conflictingSlot: slot };
    }
  }
  return { hasConflict: false };
};

// --- 7. DATE COMPARISON FUNCTIONS ---

const isSameDay = (dateA, dateB, timezone = DEFAULT_TIMEZONE) => {
  const d1 = utcToZonedTime(toDate(dateA), timezone);
  const d2 = utcToZonedTime(toDate(dateB), timezone);
  return fnsIsSameDay(d1, d2);
};

const isToday = (date, timezone = DEFAULT_TIMEZONE) => {
  return isSameDay(date, new Date(), timezone);
};

const isHoliday = (date, holidayList) => {
  const d = toDate(date);
  const dStr = formatDate(d, 'ISO_DATE');
  const holiday = holidayList.find(h => {
    const hDate = typeof h === 'string' ? h : formatDate(toDate(h.date || h), 'ISO_DATE');
    return hDate === dStr;
  });
  return holiday ? { isHoliday: true, holidayName: holiday.name || 'Holiday' } : { isHoliday: false };
};

const getExpiryStatus = (expiryDate, thresholds = { critical: 7, warning: 30, notice: 90 }) => {
  const d = toDate(expiryDate);
  const days = differenceInCalendarDays(d, new Date());

  if (days < 0) return { status: 'expired', daysRemaining: days, color: 'red', message: `Expired ${Math.abs(days)} days ago` };
  if (days <= thresholds.critical) return { status: 'critical', daysRemaining: days, color: 'red', message: `Expires in ${days} days` };
  if (days <= thresholds.warning) return { status: 'warning', daysRemaining: days, color: 'orange', message: `Expires in ${days} days` };
  if (days <= thresholds.notice) return { status: 'notice', daysRemaining: days, color: 'yellow', message: `Expires in ${days} days` };
  return { status: 'valid', daysRemaining: days, color: 'green', message: 'Valid' };
};

const daysUntilExpiry = (expiryDate) => {
  return differenceInCalendarDays(toDate(expiryDate), new Date());
};

const isExpired = (expiryDate, bufferDays = 0) => {
  return differenceInDays(toDate(expiryDate), add(new Date(), { days: bufferDays })) < 0;
};

// --- Time Utilities & Intervals ---

const roundToNearestInterval = (date, interval = 15) => {
  return roundToNearestMinutes(toDate(date), { nearestTo: interval });
};

const getETA = (origin, durationMins, timezone = DEFAULT_TIMEZONE) => {
  const eta = add(toDate(origin), { minutes: durationMins });
  return {
    eta,
    etaFormatted: formatDate(eta, 'TIME_12', timezone),
    etaRelative: formatRelativeTime(eta),
    duration: durationMins
  };
};

const getTimeOfDay = (date, timezone = DEFAULT_TIMEZONE) => {
  const hours = getHours(utcToZonedTime(toDate(date), timezone));
  if (hours >= 6 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 17) return 'afternoon';
  if (hours >= 17 && hours < 22) return 'evening';
  return 'night';
};

// --- Clinical Logic (GFR) ---

const calculateGFR = (creatinine, age, gender, isBlack = false) => {
  // CKD-EPI 2021 Equation (simplified)
  const kappa = gender === 'female' ? 0.7 : 0.9;
  const alpha = gender === 'female' ? -0.241 : -0.302;
  const genderConstant = gender === 'female' ? 1.012 : 1;
  const raceConstant = isBlack ? 1 : 1; // 2021 race-free adjustment
  
  const gfr = 142 * Math.pow(Math.min(creatinine / kappa, 1), alpha) * 
              Math.pow(Math.max(creatinine / kappa, 1), -1.2) * 
              Math.pow(0.9938, age) * genderConstant * raceConstant;

  let stage = 'G1';
  if (gfr < 15) stage = 'G5';
  else if (gfr < 30) stage = 'G4';
  else if (gfr < 45) stage = 'G3b';
  else if (gfr < 60) stage = 'G3a';
  else if (gfr < 90) stage = 'G2';

  return { gfr: parseFloat(gfr.toFixed(2)), stage };
};

const parseAgeToDateOfBirth = (age, unit = 'years') => {
  const dob = sub(new Date(), { [unit]: age });
  return { estimatedDOB: dob, isApproximate: true };
};

// --- 8. TIMEZONE UTILITIES ---

const toTimezone = (utcDate, timezone = DEFAULT_TIMEZONE) => {
  return utcToZonedTime(toDate(utcDate), timezone);
};

const fromTimezone = (localDate, timezone = DEFAULT_TIMEZONE) => {
  return zonedTimeToUtc(toDate(localDate), timezone);
};

const getHospitalTime = (utcDate) => toTimezone(utcDate, DEFAULT_TIMEZONE);

const nowInHospitalTime = () => toTimezone(new Date(), DEFAULT_TIMEZONE);

// --- 9. AGE AND MEDICAL UTILITIES ---

const getAgeCategory = (dateOfBirth) => {
  const dob = toDate(dateOfBirth);
  const age = calculateAge(dob);
  const days = age.totalDays;
  const months = age.totalMonths;
  const years = age.years;

  if (days <= 28) return 'neonate';
  if (months < 12) return 'infant';
  if (years < 3) return 'toddler';
  if (years < 12) return 'child';
  if (years < 18) return 'adolescent';
  if (years < 60) return 'adult';
  if (years < 80) return 'senior';
  return 'elderly';
};

const calculateGestationalAge = (lmp, referenceDate = new Date()) => {
  const start = toDate(lmp);
  const ref = toDate(referenceDate);
  const totalDays = differenceInDays(ref, start);
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  let trimester = 1;
  if (weeks >= 13 && weeks < 27) trimester = 2;
  else if (weeks >= 27) trimester = 3;

  return {
    weeks,
    days,
    totalDays,
    trimester,
    estimatedDueDate: add(start, { days: 280 }),
    formatted: `${weeks} weeks ${days} days`
  };
};

const getBloodGroupCompatibility = (group) => {
  const matrix = {
    'O+': { receive: ['O+', 'O-'], donate: ['O+', 'A+', 'B+', 'AB+'] },
    'O-': { receive: ['O-'], donate: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] },
    'A+': { receive: ['A+', 'A-', 'O+', 'O-'], donate: ['A+', 'AB+'] },
    'A-': { receive: ['A-', 'O-'], donate: ['A+', 'A-', 'AB+', 'AB-'] },
    'B+': { receive: ['B+', 'B-', 'O+', 'O-'], donate: ['B+', 'AB+'] },
    'B-': { receive: ['B-', 'O-'], donate: ['B+', 'B-', 'AB+', 'AB-'] },
    'AB+': { receive: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'], donate: ['AB+'] },
    'AB-': { receive: ['AB-', 'A-', 'B-', 'O-'], donate: ['AB+', 'AB-'] }
  };
  const res = matrix[group] || { receive: [], donate: [] };
  return {
    ...res,
    isUniversalDonor: group === 'O-',
    isUniversalRecipient: group === 'AB+'
  };
};

// --- 10. REPORT DATE RANGE UTILITIES ---

const getDateRangeForPeriod = (period, referenceDate = new Date(), timezone = DEFAULT_TIMEZONE) => {
  const ref = toTimezone(referenceDate, timezone);
  let start, end, label;

  switch (period) {
    case 'today':
      start = startOfDay(ref, timezone);
      end = endOfDay(ref, timezone);
      label = `Today (${formatDate(start, 'DISPLAY', timezone)})`;
      break;
    case 'this_month':
      start = startOfMonth(ref, timezone);
      end = endOfMonth(ref, timezone);
      label = `This Month (${formatDate(start, 'MONTH_YEAR', timezone)})`;
      break;
    case 'this_fy':
      const fy = getFinancialYear(ref);
      start = fy.startDate;
      end = fy.endDate;
      label = `Current Financial Year (${fy.label})`;
      break;
    default:
      start = startOfDay(ref, timezone);
      end = endOfDay(ref, timezone);
      label = period;
  }
  return { startDate: start, endDate: end, label, periodType: period };
};

// --- 11. SCHEDULING HELPERS ---

const generateDatesBetween = (startDate, endDate, step = 1, unit = 'days') => {
  const start = toDate(startDate);
  const end = toDate(endDate);
  const dates = [];
  let current = start;
  while (current <= end && dates.length < 365) {
    dates.push(current);
    current = add(current, { [unit]: step });
  }
  return dates;
};

// --- 12. CLINICAL CALCULATIONS (BMI, GFR, BSA) ---

const calculateBMI = (weightKg, heightCm) => {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let category, label, color;

  if (bmi < 18.5) { category = 'underweight'; label = 'Underweight (< 18.5)'; color = 'yellow'; }
  else if (bmi < 25) { category = 'normal'; label = 'Normal weight (18.5 – 24.9)'; color = 'green'; }
  else if (bmi < 30) { category = 'overweight'; label = 'Overweight (25 – 29.9)'; color = 'orange'; }
  else { category = 'obese'; label = 'Obese (≥ 30)'; color = 'red'; }

  return { bmi: parseFloat(bmi.toFixed(2)), category, categoryLabel: label, color };
};

const calculateBSA = (weightKg, heightCm, formula = 'mosteller') => {
  let bsa;
  if (formula === 'mosteller') {
    bsa = Math.sqrt((heightCm * weightKg) / 3600);
  } else {
    // DuBois formula: 0.007184 × W^0.425 × H^0.725
    bsa = 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725);
  }
  return { bsa: parseFloat(bsa.toFixed(4)), unit: 'm²', formula };
};

// --- EXPORTS ---

module.exports = {
  // Constants
  TIMEZONES,
  DATE_FORMATS,
  VITAL_THRESHOLDS,
  DEFAULT_TIMEZONE,
  DEFAULT_LOCALE,
  FINANCIAL_YEAR_START_MONTH,
  
  // Formatting
  formatDate,
  formatDateTime,
  formatTime,
  formatTimeRange,
  formatDateRange,
  formatDuration,
  formatAge,
  formatRelativeTime,
  formatCurrency,
  formatIndianNumber,

  // Parsing
  parseDate,
  parseDateTime,
  parseTime,
  parseDuration,
  parseISO,
  fromTimestamp,

  // Calculation
  calculateAge,
  calculateDuration,
  calculateLengthOfStay,
  addTime,
  subtractTime,
  differenceInWorkingDays,
  calculateLeavedays,
  calculateOvertimeHours,
  calculateShiftDuration,

  // Boundary
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,

  // Financial Year
  getFinancialYear,
  startOfFinancialYear,
  endOfFinancialYear,
  getFinancialQuarter,

  // Shift/Schedule
  getShiftForTime,
  isWithinShift,
  generateTimeSlots,
  hasTimeConflict,

  // Comparison
  isSameDay,
  isToday,
  isHoliday,
  getExpiryStatus,

  // Timezone
  toTimezone,
  fromTimezone,
  getHospitalTime,
  nowInHospitalTime,

  // Medical
  getAgeCategory,
  calculateGestationalAge,
  getBloodGroupCompatibility,
  calculateBMI,
  calculateBSA,

  // Reports
  getDateRangeForPeriod,

  // Scheduling Helpers
  generateDatesBetween,

  // DB Helpers
  formatDateForDB: (d) => d ? fnsFormat(toDate(d), 'yyyy-MM-dd') : null,
  formatDateTimeForDB: (d) => d ? fnsFormat(toDate(d), 'yyyy-MM-dd HH:mm:ss') : null
};
