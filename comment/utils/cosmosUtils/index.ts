import { CosmosClient } from '@azure/cosmos';
import { Agent } from 'https';

const client = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY,
    agent: new Agent({
        rejectUnauthorized: process.env.NODE_ENV !== 'development',
    }),
});

const getDatabase = async () => {
    const { database } = await client.databases.createIfNotExists({ id: 'hobbyist-db' });
    return database;
};

export const getUsersContainer = async () => {
    const db = await getDatabase();
    const { container } = await db.containers.createIfNotExists(
        { id: 'users', partitionKey: '/userId' },
        { offerThroughput: 400 }
    );
    return container;
};

export const getHobbiesContainer = async () => {
    const db = await getDatabase();
    const { container } = await db.containers.createIfNotExists(
        { id: 'hobbies', partitionKey: '/slug' },
        { offerThroughput: 400 }
    );
    return container;
};

export const getPostsContainer = async () => {
    const db = await getDatabase();
    const { container } = await db.containers.createIfNotExists(
        { id: 'posts', partitionKey: '/id' },
        { offerThroughput: 400 }
    );
    return container;
};

export const getCommentsContainer = async () => {
    const db = await getDatabase();
    const { container } = await db.containers.createIfNotExists(
        { id: 'comments', partitionKey: '/uid' },
        { offerThroughput: 400 }
    );
    return container;
};