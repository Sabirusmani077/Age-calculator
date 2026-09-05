/**
 * AgeCalculator.js
 * High-precision temporal engine: exact calendar calculation, live millisecond ticker,
 * cumulative unit breakdowns, next birthday forecast, planetary ages, and life metrics.
 */

export class AgeCalculator {
  static getZodiac(month, day) {
    const signs = [
      { sign: 'Capricorn', symbol: '♑', element: 'Earth', stone: 'Garnet', end: [1, 19] },
      { sign: 'Aquarius', symbol: '♒', element: 'Air', stone: 'Amethyst', end: [2, 18] },
      { sign: 'Pisces', symbol: '♓', element: 'Water', stone: 'Aquamarine', end: [3, 20] },
      { sign: 'Aries', symbol: '♈', element: 'Fire', stone: 'Diamond', end: [4, 19] },
      { sign: 'Taurus', symbol: '♉', element: 'Earth', stone: 'Emerald', end: [5, 20] },
      { sign: 'Gemini', symbol: '♊', element: 'Air', stone: 'Pearl', end: [6, 20] },
      { sign: 'Cancer', symbol: '♋', element: 'Water', stone: 'Ruby', end: [7, 22] },
      { sign: 'Leo', symbol: '♌', element: 'Fire', stone: 'Peridot', end: [8, 22] },
      { sign: 'Virgo', symbol: '♍', element: 'Earth', stone: 'Sapphire', end: [9, 22] },
      { sign: 'Libra', symbol: '♎', element: 'Air', stone: 'Opal', end: [10, 22] },
      { sign: 'Scorpio', symbol: '♏', element: 'Water', stone: 'Topaz', end: [11, 21] },
      { sign: 'Sagittarius', symbol: '♐', element: 'Fire', stone: 'Turquoise', end: [12, 21] },
      { sign: 'Capricorn', symbol: '♑', element: 'Earth', stone: 'Garnet', end: [12, 31] }
    ];

    for (const z of signs) {
      if (month < z.end[0] || (month === z.end[0] && day <= z.end[1])) {
        return z;
      }
    }
    return signs[0];
  }

  static getChineseZodiac(year) {
    const animals = [
      { animal: 'Rat', symbol: '🐀' },
      { animal: 'Ox', symbol: '🐂' },
      { animal: 'Tiger', symbol: '🐅' },
      { animal: 'Rabbit', symbol: '🐇' },
      { animal: 'Dragon', symbol: '🐉' },
      { animal: 'Snake', symbol: '🐍' },
      { animal: 'Horse', symbol: '🐎' },
      { animal: 'Goat', symbol: '🐐' },
      { animal: 'Monkey', symbol: '🐒' },
      { animal: 'Rooster', symbol: '🐓' },
      { animal: 'Dog', symbol: '🐕' },
      { animal: 'Pig', symbol: '🐖' }
    ];
    // Year 1900 was Year of the Rat
    const index = (year - 1900) % 12;
    return animals[index >= 0 ? index : (index + 12) % 12];
  }

  static isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  static getDaysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  /**
   * Calculate exact breakdown between birthDate and now.
   * @param {Date} birthDate
   * @param {Date} now
   */
  static calculate(birthDate, now = new Date()) {
    if (!(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
      return null;
    }

    if (birthDate > now) {
      return { isFuture: true };
    }

    const birthYear = birthDate.getFullYear();
    const birthMonth = birthDate.getMonth();
    const birthDay = birthDate.getDate();
    const birthHour = birthDate.getHours();
    const birthMinute = birthDate.getMinutes();
    const birthSecond = birthDate.getSeconds();
    const birthMs = birthDate.getMilliseconds();

    let curYear = now.getFullYear();
    let curMonth = now.getMonth();
    let curDay = now.getDate();
    let curHour = now.getHours();
    let curMinute = now.getMinutes();
    let curSecond = now.getSeconds();
    let curMs = now.getMilliseconds();

    // Milliseconds borrow
    let ms = curMs - birthMs;
    if (ms < 0) {
      ms += 1000;
      curSecond -= 1;
    }

    // Seconds borrow
    let seconds = curSecond - birthSecond;
    if (seconds < 0) {
      seconds += 60;
      curMinute -= 1;
    }

    // Minutes borrow
    let minutes = curMinute - birthMinute;
    if (minutes < 0) {
      minutes += 60;
      curHour -= 1;
    }

    // Hours borrow
    let hours = curHour - birthHour;
    if (hours < 0) {
      hours += 24;
      curDay -= 1;
    }

    // Days borrow
    let days = curDay - birthDay;
    if (days < 0) {
      // Days in previous month
      const prevMonth = (curMonth - 1 + 12) % 12;
      const prevMonthYear = prevMonth === 11 ? curYear - 1 : curYear;
      const daysInPrevMonth = this.getDaysInMonth(prevMonthYear, prevMonth);
      days += daysInPrevMonth;
      curMonth -= 1;
    }

    // Months borrow
    let months = curMonth - birthMonth;
    if (months < 0) {
      months += 12;
      curYear -= 1;
    }

    let years = curYear - birthYear;

    // Total milliseconds elapsed
    const totalMs = now.getTime() - birthDate.getTime();
    const totalSeconds = Math.floor(totalMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const totalWeeks = Math.floor(totalDays / 7);
    const totalRemainingDays = totalDays % 7;
    const totalMonthsExact = (years * 12 + months + days / 30.4375).toFixed(1);

    // Next Birthday calculation
    const thisYearBday = new Date(now.getFullYear(), birthMonth, birthDay, birthHour, birthMinute, 0);
    let nextBday = thisYearBday;
    if (now > thisYearBday) {
      nextBday = new Date(now.getFullYear() + 1, birthMonth, birthDay, birthHour, birthMinute, 0);
    }
    const msUntilBday = nextBday.getTime() - now.getTime();
    const bdayTotalSec = Math.floor(msUntilBday / 1000);
    const bdayDays = Math.floor(bdayTotalSec / 86400);
    const bdayHours = Math.floor((bdayTotalSec % 86400) / 3600);
    const bdayMins = Math.floor((bdayTotalSec % 3600) / 60);
    const bdaySecs = bdayTotalSec % 60;
    const turningAge = nextBday.getFullYear() - birthYear;

    // Next 5 birthdays day of week
    const upcomingBirthdays = [];
    const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (let i = 0; i < 5; i++) {
      const yearCheck = nextBday.getFullYear() + i;
      const d = new Date(yearCheck, birthMonth, birthDay);
      upcomingBirthdays.push({
        year: yearCheck,
        dayOfWeek: weekdayNames[d.getDay()],
        turning: yearCheck - birthYear
      });
    }

    // Zodiac
    const westernZodiac = this.getZodiac(birthMonth + 1, birthDay);
    const chineseZodiac = this.getChineseZodiac(birthYear);

    // Fun Metrics
    const heartbeats = Math.floor(totalMinutes * 75); // avg 75 bpm
    const breaths = Math.floor(totalMinutes * 16);     // avg 16 breaths/min
    const sleepHours = Math.floor(totalHours * 0.33); // 1/3 of life asleep
    const spaceDistanceKm = Math.floor(totalDays * 2.57e6); // ~2.57 million km per day around Sun
    const marsAge = (years + (months * 30.44 + days) / 365.25) / 1.8808;
    const jupiterAge = (years + (months * 30.44 + days) / 365.25) / 11.862;
    const venusAge = (years + (months * 30.44 + days) / 365.25) / 0.6152;
    const mercuryAge = (years + (months * 30.44 + days) / 365.25) / 0.2408;

    // Major Milestones
    const day10kDate = new Date(birthDate.getTime() + 10000 * 86400000);
    const sec1bDate = new Date(birthDate.getTime() + 1000000000 * 1000);

    return {
      isFuture: false,
      primary: {
        years,
        months,
        days,
        hours,
        minutes,
        seconds,
        ms
      },
      totals: {
        totalDays,
        totalWeeks,
        totalRemainingDays,
        totalMonthsExact,
        totalHours,
        totalMinutes,
        totalSeconds,
        totalMs
      },
      nextBirthday: {
        date: nextBday,
        days: bdayDays,
        hours: bdayHours,
        minutes: bdayMins,
        seconds: bdaySecs,
        turningAge,
        upcoming: upcomingBirthdays
      },
      astronomy: {
        westernZodiac,
        chineseZodiac,
        spaceDistanceKm,
        marsAge: marsAge.toFixed(2),
        jupiterAge: jupiterAge.toFixed(2),
        venusAge: venusAge.toFixed(2),
        mercuryAge: mercuryAge.toFixed(2)
      },
      biology: {
        heartbeats,
        breaths,
        sleepHours
      },
      milestones: {
        day10k: day10kDate,
        sec1b: sec1bDate
      }
    };
  }
}
