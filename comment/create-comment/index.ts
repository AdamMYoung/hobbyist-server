import { AzureFunction, Context } from '@azure/functions';
import { Comment, CommentCosmosResult, CommentEntry, CreateCommentRequest, UserProfileCosmosResult } from '../types';
import { cosmos } from '../utils';
import { withAuth } from '../utils/authUtils';
import { getId } from '../utils/stringUtils';

const httpTrigger: AzureFunction = withAuth<CreateCommentRequest>(
    null,
    async function (context: Context, body, token): Promise<void> {
        const { hobbySlug, postToken } = context.req.query;

        const commentsContainer = await cosmos.getCommentsContainer();

        const comment: Partial<CommentCosmosResult> = {
            hobbySlug,
            postToken,
            uid: getId(12),
            userUid: token.sub,
            content: body.content,
            creationDate: new Date(),
        };

        if (body.parentUid && body.rootUid) {
            comment.rootUid = body.rootUid;

            const { resources: comments } = await commentsContainer.items
                .query<CommentCosmosResult>({
                    query: `SELECT TOP 1 * FROM c WHERE c["uid"] = @rootUid`,
                    parameters: [{ name: '@rootUid', value: body.rootUid }],
                })
                .fetchAll();

            if (!comments[0]) {
                context.res = {
                    status: 404,
                    body: `Root comment not found. Root comment UID: ${body.rootUid}`,
                };
            }

            return;
        } else {
            comment.rootUid = comment.uid;

            const { resource: insertedComment } = await commentsContainer.items.upsert<Partial<CommentCosmosResult>>(
                comment
            );

            context.res = {
                status: 201,
                body: {
                    uid: insertedComment.uid,
                    rootUid: insertedComment.rootUid,
                    profile: null,
                    content: insertedComment.content,
                    creationDate: insertedComment.creationDate,
                    replies: null,
                } as Partial<Comment>,
            };

            return;
        }
    }
);

export default httpTrigger;
