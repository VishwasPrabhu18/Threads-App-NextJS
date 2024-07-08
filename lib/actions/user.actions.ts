"use server";

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Thread from "../models/thread.model";
import { FilterQuery, SortOrder } from "mongoose";

interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
};

export async function updateUser({
  userId, username, name, bio, image, path
}: Params): Promise<void> {

  connectToDB();

  try {
    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        onboarded: true,
      },
      { upsert: true },
    );

    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    throw new Error(`Failed to create/update user: ${error.message}`)
  }
}

export async function fetchUser(userId: string) { 
  try {
    connectToDB();

    return await User
      .findOne({ id: userId })
      // .populate({
      //   path: "communities",
      //   model: Community,
    // });
    
  } catch (error: any) {
    throw new Error(`Failed to fetch user: ${error.message}`)
  }
}

export async function fetchUserPosts(userId: string) {
  try {
    connectToDB();

    // find all threads where the author is the user
    const threads = await User
      .findOne({ id: userId })
      .populate({
        path: "threads",
        model: Thread,
        populate: {
          path: "children",
          model: Thread,
          populate: {
            path: "author",
            model: User,
            select: "name image id",
          },
        },
      });
    
    return threads;
  } catch (error: any) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }
}

interface fetchUserProps {
  userId: string;
  searchString?: string;
  pageNumer?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}

export async function fetchUsers({
  userId,
  searchString = "",
  pageNumer = 1,
  pageSize = 20,
  sortBy = "desc",
}: fetchUserProps) {
  try {
    connectToDB();

    const skipAmount = (pageNumer - 1) * pageSize;
  
    const regex = new RegExp(searchString, "i");
    
    const query: FilterQuery<typeof User> = {
      id: {$ne: userId},
    }

    if(searchString.trim() !== "") {
      query.$or = [
        { name: {$regex: regex} },
        { username: {$regex: regex} },
      ];
    };

    const sortOption = {
      createAt: sortBy,
    };

    const usersQuery = User
      .find(query)
      .sort(sortOption)
      .skip(skipAmount)
      .limit(pageSize);
    
    const totalUserCount = await User.countDocuments(query);

    const users = await usersQuery.exec();

    const isNext = totalUserCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error: any) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }
}