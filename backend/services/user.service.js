import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import { publicUser } from "../utils/publicUser.js";
import { AppError } from "../utils/AppError.js";

const userCard = (u) => ({
  _id: u._id,
  username: u.username,
  name: u.name,
  avatar: u.avatar,
  bio: u.bio,
});

// -------------------------------------------------- Create User ------------------------------------------
export const createUser = async (userData) => {
  const { username, email, password, name } = userData;

  const [existingEmail, existingUsername] = await Promise.all([
    User.findOne({ email }),
    User.findOne({ username }),
  ]);

  if (existingEmail) throw new AppError("Email is already in use", 400);

  if (existingUsername) throw new AppError("Username is already in use", 400);

  const hashedPassword = await bcryptjs.hash(password, 10);
  const verificationToken = Math.floor(
    100000 + Math.random() * 900000,
  ).toString();

  const user = new User({
    username,
    email,
    password: hashedPassword,
    name,
    provider: "local",
    verificationToken,
    verificationTokenExpiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  await user.save();
  return publicUser(user);
};

// -------------------------------------------------- Get User ------------------------------------------
export const getMe = async (userId) => {
  const user = await User.findById(userId);

  if (!user) throw new AppError("User not found", 404);

  return publicUser(user);
};

// ---------------------------------------------------- Get Profile ------------------------------------------
export const getProfileService = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  return publicUser(user);
};

// ---------------------------------------------------- Update Profile ------------------------------------------
export const updateProfileService = async (userId, updatedData, file) => {
  const { name, bio } = updatedData;

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (file) {
    user.avatar = `/uploads/${file.filename}`;
  }

  if (name !== undefined) {
    user.name = name;
  }

  if (bio !== undefined) {
    user.bio = bio;
  }

  await user.save();

  return publicUser(user);
};

// ------------------------------------------ Search Users ------------------------------------------
export const searchUserService = async (queryData, userId) => {
  const { query = "", page = 1, limit = 15 } = queryData;
  const me = await User.findById(userId).select("friends");

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit) || 15, 1), 50);

  const filter = {
    _id: { $ne: userId },
  };

  if (query.trim()) {
    filter.$or = [
      { username: { $regex: query.trim(), $options: "i" } },
      { name: { $regex: query.trim(), $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("username name avatar bio")
      .sort({ username: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  // figure out relationship status for each user
  const friendIds = new Set((me.friends || []).map((id) => id.toString()));
  const userIds = users.map((u) => u._id);

  const requests = await FriendRequest.find({
    status: "pending",
    $or: [
      { sender: userId, receiver: { $in: userIds } },
      { receiver: userId, sender: { $in: userIds } },
    ],
  });

  const pendingSent = new Set(
    requests
      .filter((r) => r.sender.toString() === userId)
      .map((r) => r.receiver.toString()),
  );
  const pendingReceived = new Map(
    requests
      .filter((r) => r.receiver.toString() === userId)
      .map((r) => [r.sender.toString(), r._id.toString()]),
  );

  const results = users.map((u) => {
    const id = u._id.toString();
    let status = "none";
    let requestId = null;
    if (friendIds.has(id)) status = "friends";
    else if (pendingSent.has(id)) status = "pending_sent";
    else if (pendingReceived.has(id)) {
      status = "pending_received";
      requestId = pendingReceived.get(id);
    }
    return { ...userCard(u), status, requestId };
  });

  return {
    users: results,
    page: pageNum,
    hasMore: pageNum * limitNum < total,
    total,
  };
};

// ---------------------------------------------- Get a single user's public profile --------------------------------
export const getUserByIdService = async (userId) => {
  const user = await User.findById(userId).select("username name avatar bio");

  if (!user) throw new AppError("User not found", 404);

  return {
    ...userCard(user),
    online: onlineUsers.has(user._id.toString()),
  };
};

// ---------------------------------------------- Friends list --------------------------------
export const getFriendsService = async (userId) => {
  const user = await User.findById(userId).populate(
    "friends",
    "username name avatar bio",
  );
  const friends = user.friends.map((f) => ({
    ...userCard(f),
    online: onlineUsers.has(f._id.toString()),
  }));

  return friends;
};

// ---------------------------------------------- Send friend request --------------------------------
export const sendFriendRequestService = async (receiverId, userId) => {
  if (receiverId === userId) throw new AppError("You can't add yourself", 400);

  const receiver = await User.findById(receiverId);
  if (!receiver) throw new AppError("User not found", 404);

  const me = await User.findById(userId);

  if (me.friends.some((f) => f.toString() === receiverId))
    throw new AppError("Already friends", 400);

  // if the other user already sent us a request, auto-accept instead
  const reverse = await FriendRequest.findOne({
    sender: receiverId,
    receiver: userId,
    status: "pending",
  });
  if (reverse) {
    reverse.status = "accepted";
    await reverse.save();
    me.friends.push(receiverId);
    receiver.friends.push(userId);
    await me.save();
    await receiver.save();

    getIO()
      .to(receiverId)
      .emit("friendRequestAccepted", {
        by: userCard(me),
      });
    return {
      message: "You are now friends",
      status: "friends",
    };
  }

  const existing = await FriendRequest.findOne({
    sender: userId,
    receiver: receiverId,
  });
  if (existing) {
    if (existing.status === "pending") throw new AppError("Already sent", 400);
    existing.status = "pending";
    await existing.save();
  } else {
    await FriendRequest.create({ sender: userId, receiver: receiverId });
  }

  getIO()
    .to(receiverId)
    .emit("friendRequest", {
      from: userCard(me),
    });
  return {
    message: "Friend request sent",
    status: "pending_sent",
  };
};

// ---------------------------------------------- Incoming friend requests (notifications) -----------------
export const getFriendRequestService = async (userId) => {
  const requests = await FriendRequest.find({
    receiver: userId,
    status: "pending",
  })
    .populate("sender", "username name avatar bio")
    .sort({ createdAt: -1 });

  return requests.map((r) => ({
    _id: r._id,
    sender: userCard(r.sender),
    createdAt: r.createdAt,
  }));
};

// ---------------------------------------------- Accept / Reject --------------------------------
export const respondFriendRequestService = async (reqId, userId, action) => {
  const request = await FriendRequest.findById(reqId);
  if (!request || request.receiver.toString() !== userId)
    throw new AppError("Request not found", 404);
  if (request.status !== "pending")
    throw new AppError("Request already handled", 400);

  if (action === "accept") {
    request.status = "accepted";
    await request.save();

    await User.findByIdAndUpdate(request.sender, {
      $addToSet: { friends: request.receiver },
    });
    const me = await User.findByIdAndUpdate(
      request.receiver,
      { $addToSet: { friends: request.sender } },
      { new: true },
    );

    getIO()
      .to(request.sender.toString())
      .emit("friendRequestAccepted", {
        by: userCard(me),
      });

    return {
      message: "You are now friends",
      status: "friends",
    };
  } else {
    request.status = "rejected";
    await request.save();
    return {
      message: "Request rejected",
      status: "rejected",
    };
  }
};
