import { CosmosClient } from '@azure/cosmos';

const client = new CosmosClient({ endpoint: process.env.COSMOS_DB_ENDPOINT, key: process.env.COSMOS_DB_KEY });

const getDatabase = async () => {
    const { database } = await client.databases.createIfNotExists({ id: 'hobbyist-db' });
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
