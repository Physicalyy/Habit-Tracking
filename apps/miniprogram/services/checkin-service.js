const {
  checkinHabit: checkinHabitEndpoint,
  checkinHistory,
  checkinSummary,
  todayHabits,
} = require("../core/api.js");
const { request } = require("../utils/request.js");

async function listTodayHabits(childId) {
  const result = await request(todayHabits(childId));
  return result.data;
}

async function checkinHabit(childId, childHabitId) {
  const result = await request(checkinHabitEndpoint(childId, childHabitId));
  return result.data;
}

async function listCheckinHistory(childId) {
  const result = await request(checkinHistory(childId));
  return result.data;
}

async function getCheckinSummary(childId) {
  const result = await request(checkinSummary(childId));
  return result.data;
}

module.exports = {
  listTodayHabits,
  checkinHabit,
  listCheckinHistory,
  getCheckinSummary,
};
