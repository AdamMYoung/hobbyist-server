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
    const { database } = await client.databases.createIfNotExists({ id: 'hobbyist-db' }, { offerThroughput: 400 });
    return database;
};

export const getUsersContainer = async () => {
    const db = await getDatabase();
    const { container } = await db.containers.createIfNotExists({ id: 'users' });
    return container;
};

export const getHobbiesContainer = async () => {
    const db = await getDatabase();
    const { container } = await db.containers.createIfNotExists({ id: 'hobbies' });
    return container;
};

export const getMeetupsContainer = async () => {
    const db = await getDatabase();
    const { container } = await db.containers.createIfNotExists({ id: 'meetups' });
    return container;
};
