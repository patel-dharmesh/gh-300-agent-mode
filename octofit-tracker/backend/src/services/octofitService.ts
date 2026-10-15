import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeObjectIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry))
    .filter((entry) => mongoose.isValidObjectId(entry))
    .map((entry) => new mongoose.Types.ObjectId(entry));
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw badRequest('Activity payload is required');
  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  const normalizedType = normalizeString(type);
  const normalizedMinutes = Number(minutes);

  if (!mongoose.isValidObjectId(String(userId))) throw badRequest('A valid userId is required');
  if (!mongoose.isValidObjectId(String(teamId))) throw badRequest('A valid teamId is required');
  if (!normalizedType) throw badRequest('Activity type is required');
  if (!Number.isFinite(normalizedMinutes) || normalizedMinutes <= 0) throw badRequest('Minutes must be a positive number');

  const user = await User.findById(userId).lean();
  if (!user) throw notFound('User not found');

  const team = await Team.findById(teamId).lean();
  if (!team) throw notFound('Team not found');

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: normalizedType,
    minutes: normalizedMinutes,
    points: Math.max(1, Math.round(normalizedMinutes)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw badRequest('Team payload is required');
  const { name, mascot, members } = input as Record<string, unknown>;
  const normalizedName = normalizeString(name);
  const normalizedMascot = normalizeString(mascot);

  if (!normalizedName) throw badRequest('Team name is required');
  if (!normalizedMascot) throw badRequest('Team mascot is required');

  const sanitizedMembers = normalizeObjectIds(members);
  const team = await Team.create({
    name: normalizedName,
    mascot: normalizedMascot,
    members: sanitizedMembers,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamId: '$_id', teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = normalizeString(userEmail);
  if (!normalizedEmail) throw badRequest('User email is required');

  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) throw notFound('User not found');

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const activityTypeCounts = new Map<string, number>();
  for (const activity of recentActivities) {
    const type = normalizeString((activity as { type?: unknown }).type);
    if (!type) continue;
    activityTypeCounts.set(type, (activityTypeCounts.get(type) ?? 0) + 1);
  }
  const primaryActivity = [...activityTypeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  const preferredFocus = normalizeString((user as { fitnessGoal?: unknown }).fitnessGoal) || primaryActivity;

  const workouts = await Workout.find().lean();
  const ranked = workouts
    .sort((left, right) => {
      const leftScore = Number(left.focus === preferredFocus) + Number(left.focus === primaryActivity);
      const rightScore = Number(right.focus === preferredFocus) + Number(right.focus === primaryActivity);
      return rightScore - leftScore;
    })
    .map((workout) => {
      const focus = normalizeString(workout.focus);
      const reasonParts = [] as string[];
      if (preferredFocus) reasonParts.push(`your ${preferredFocus} goal`);
      if (primaryActivity) reasonParts.push(`recent ${primaryActivity} activity`);
      return {
        ...workout,
        reason: `Matches ${reasonParts.join(' and ') || 'your recent activity'}.`,
      };
    });

  const exactMatches = ranked.filter((workout) => normalizeString(workout.focus) === preferredFocus);
  return exactMatches.length > 0 ? exactMatches : ranked;
}

export { User };
