import { MESSAGE_STATUSES } from "../constants/statuses"

type SummaryResponse = {
    summary:string,
    status: string
}
/**
 * Return formatted resolved, unresolved or in progress summary for slack base on the status. 
 * @param summarizedResponse 
 * @returns 
 */
export const buildResolvedSummary = (summarizedResponse: SummaryResponse) => {
    const { summary, status } = summarizedResponse;
    if (status == MESSAGE_STATUSES.RESOLVED) {
        const resolvedSummary = {
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "✅ *Thread Resolved!*",
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Summary:*\n${summary}`,
                },
              },
            ],
          };
          return resolvedSummary;
    } else if (status === MESSAGE_STATUSES.UNRESOLVED || status === MESSAGE_STATUSES.IN_PROGRESS) {
        const unResolvedSummary = {
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "⚠️ *Issue Still Unresolved*",
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Summary:*\n${summary}`,
                },
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "_Anyone have an update on this?_",
                },
              },
            ],
          };
          return unResolvedSummary;
    }

}