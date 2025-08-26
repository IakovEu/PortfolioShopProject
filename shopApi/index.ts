import express, { Express } from 'express';
import { Connection } from 'mysql2/promise';
import { commentsRouter } from './src/api/comments-api.js';
import { productsRouter } from './src/api/products-api.js';
import { authRouter } from './src/api/auth-api.js';

export let connection: Connection;

export default function shopApi(dbConnection: Connection): Express {
	const app = express();
	app.use(express.json());

	connection = dbConnection;

	app.use('/comments', commentsRouter);
	app.use('/products', productsRouter);
	app.use('/auth', authRouter);

	return app;
}
