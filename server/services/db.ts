import mysql, { Connection } from 'mysql2/promise';

// Инициализация БД
export async function initDataBase(): Promise<Connection | null> {
	const { DB_HOST, DB_PORT, DB_PASSWORD, DB_USER, DB_NAME } = process.env;
	let connection: Connection | null = null;

	try {
		connection = await mysql.createConnection({
			host: DB_HOST,
			port: Number(DB_PORT),
			password: DB_PASSWORD,
			user: DB_USER,
			database: DB_NAME,
		});
	} catch (e) {
		console.error((e as Error).message || e);
		return null;
	}

	console.log(`Connection to DB ProductsApplication established`);
	return connection;
}
