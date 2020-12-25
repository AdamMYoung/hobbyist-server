import { AzureFunction, Context } from '@azure/functions';
import { Comment, CommentCosmosResult, CommentEntry, PaginatedResult, UserProfileCosmosResult } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';

const httpTrigger: AzureFunction = withAuth(
    { isTokenRequired: false },
    async function (context: Context, _, token): Promise<void> {
        const { hobbySlug, postToken, continuationToken } = context.req.query;

        const userContainer = await cosmos.getUsersContainer();
        const commentsContainer = await cosmos.getCommentsContainer();

        const commentQuery = await commentsContainer.items
            .query<Partial<CommentCosmosResult>>(
                {
                    query:
                        'SELECT * FROM c WHERE c["hobbySlug"] = @hobbySlug AND c["postToken"] = @postToken ORDER BY c["_ts"] DESC',
                    parameters: [
                        { name: '@hobbySlug', value: hobbySlug },
                        { name: '@postToken', value: postToken },
                    ],
                },
                { maxItemCount: 20, continuationToken }
            )
            .fetchNext();

        const comments = commentQuery.resources;

        if (!comments || !comments[0]) {
            context.res = { body: [] };
            return;
        }

        const userIds = new Set<string>();

        //Recursively flatten list and add it
        const addUserFromComment = (comment: Partial<CommentEntry>) => {
            userIds.add(comment.userUid);
            if (!comment.replies) {
                return;
            }

            comment.replies.forEach((reply) => addUserFromComment(reply));
        };

        comments.forEach((comment) => addUserFromComment(comment));

        const { resources: users } = await userContainer.items
            .query<Partial<UserProfileCosmosResult>>({
                query:
                    'SELECT c["userId"], c["username"], c["profileSrc"] FROM c WHERE ARRAY_CONTAINS(@userIds, c["userId"])',
                parameters: [{ name: '@userIds', value: Array.from(userIds) }],
            })
            .fetchAll();

        if (!users[0]) {
            context.res = { status: 404, body: 'Error getting users of submitted comments.' };
            return;
        }

        const commentsResponse: Comment[] = comments.map<Comment>((r) =>
            parseCommentCosmosResult(r as CommentEntry, users)
        );

        context.res = {
            body: {
                continuationToken: commentQuery.continuationToken,
                hasMoreResults: commentQuery.hasMoreResults,
                items: commentsResponse,
            } as PaginatedResult<Comment[]>,
        };
    }
);

const parseCommentCosmosResult = (result: CommentEntry, users: Partial<UserProfileCosmosResult>[]): Comment => {
    const user = users.filter((u) => u.userId === result.userUid)[0];

    return {
        uid: result.uid,
        rootUid: result.rootUid,
        profile: {
            username: user.username,
            profileSrc: user.profileSrc,
        },
        content: result.content,
        creationDate: result.creationDate,
        replies: result.replies ? result.replies.map((r) => parseCommentCosmosResult(r, users)) : [],
    };
};

export default httpTrigger;
