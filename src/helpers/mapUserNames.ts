import { UsersListResponse } from "@slack/web-api";
/**
 * Takes the list of members from slack and create a map {id, real_user}
 * @param workSpaceUsersList
 * @returns
 */
export const mapUserNames = (
  workSpaceUsersList: UsersListResponse["members"]
): Map<string, string> => {
  const userNameMap = new Map<string, string>();
  workSpaceUsersList?.forEach((member) => {
    // this is the bot that we don't want // id should be unique, but just in case.
    if (
      member.name !== "thread_resolver_bot" &&
      !userNameMap.has("member.id")
    ) {
      userNameMap.set(member.id!, member.real_name!);
    }
  });
  return userNameMap;
};
