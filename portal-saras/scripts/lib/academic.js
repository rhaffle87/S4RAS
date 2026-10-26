/**
 * Academic Calendar Utility for S4RAS Backend.
 * Node.js CommonJS module.
 */

function calculateAcademicWeek(dateInput = new Date()) {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = Jan, 7 = Aug, 8 = Sep, 9 = Oct...

  let semesterStart;
  let semesterName;

  if (month >= 7 || month === 0) {
    semesterName = 'Gasal';
    const targetYear = month === 0 ? year - 1 : year;
    const aug31 = new Date(targetYear, 7, 31);
    const dayOfWeek = aug31.getDay();
    const diff = (dayOfWeek + 6) % 7;
    aug31.setDate(31 - diff);
    aug31.setHours(0, 0, 0, 0);
    semesterStart = aug31;
  } else {
    semesterName = 'Genap';
    const feb1 = new Date(year, 1, 1);
    const dayOfWeek = feb1.getDay();
    const diff = (8 - (dayOfWeek === 0 ? 7 : dayOfWeek)) % 7;
    feb1.setDate(1 + diff);
    feb1.setHours(0, 0, 0, 0);
    semesterStart = feb1;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const currentStartOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = currentStartOfDay.getTime() - semesterStart.getTime();
  const diffDays = Math.floor(diffTime / msPerDay);

  const rawWeek = Math.floor(diffDays / 7) + 1;
  const clampedWeek = Math.min(16, Math.max(1, rawWeek));

  const startYear = semesterStart.getFullYear();
  const startMonth = String(semesterStart.getMonth() + 1).padStart(2, '0');
  const startDay = String(semesterStart.getDate()).padStart(2, '0');

  return {
    week: clampedWeek,
    rawWeek,
    semester: semesterName,
    semesterStart: `${startYear}-${startMonth}-${startDay}`,
    isCapped: rawWeek > 16 || rawWeek < 1
  };
}

module.exports = {
  calculateAcademicWeek
};
