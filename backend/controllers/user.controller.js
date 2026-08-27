import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import { getIO, onlineUsers } from "../socket/socket.js";
import {
  getFriendRequestService,
  getFriendsService,
  getProfileService,
  getUserByIdService,
  respondFriendRequestService,
  searchUserService,
  sendFriendRequestService,
  updateProfileService,
} from "../services/user.service.js";
import { ProfileValidator } from "../validators/user.validator.js";

// ---------------------------------------------- Get / Update Profile --------------------------------
export const getProfile = async (req, res, next) => {
  try {
    const user = await getProfileService(req.userId);

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const result = ProfileValidator.safeParse(req.body);

    if (!result.success)
      throw new AppError(result.error.issues[0].message, 400);

    const user = await updateProfileService(req.userId, result.data, req.file);

    res.status(200).json({ success: true, message: "Profile updated", user });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------- Search users (lazy-loaded) --------------------------------
export const searchUsers = async (req, res, next) => {
  try {
    const { users, total, page, hasMore } = await searchUserService(
      req.query,
      req.userId,
    );

    return res.status(200).json({
      success: true,
      users,
      total,
      page,
      hasMore,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------- Get a single user's public profile --------------------------------
export const getUserById = async (req, res, next) => {
  try {
    const user = await getUserByIdService(req.params.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------- Friends list --------------------------------
export const getFriends = async (req, res, next) => {
  try {
    const friends = await getFriendsService(req.userId);

    res.status(200).json({ success: true, friends });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------- Send friend request --------------------------------
export const sendFriendRequest = async (req, res, next) => {
  try {
    const result = await sendFriendRequestService(req.params.id, req.userId);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------- Incoming friend requests (notifications) -----------------
export const getFriendRequests = async (req, res, next) => {
  try {
    const requests = await getFriendRequestService(req.userId);
    res.status(200).json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------- Accept / Reject --------------------------------
export const respondFriendRequest = async (req, res, next) => {
  try {
    const { action } = req.body;
    const result = await respondFriendRequestService(
      req.params.id,
      req.userId,
      action,
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
