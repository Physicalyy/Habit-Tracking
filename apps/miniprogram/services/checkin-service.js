const {
  checkinHabit: checkinHabitEndpoint,
  checkinHistory,
  checkinSummary,
  todayHabits,
  undoTodayCheckin,
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

async function undoCheckinHabit(childId, childHabitId) {
  const result = await request(undoTodayCheckin(childId, childHabitId));
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
  undoCheckinHabit,
  listCheckinHistory,
  getCheckinSummary,
};
