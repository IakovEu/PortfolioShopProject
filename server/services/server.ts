import express, { Express } from 'express';

// Инициализация сервера
export function initServer(): Express {
	const port = Number(process.env.LOCAL_PORT);
	const app = express();

	// Авто парсинг JSON данных в js объект
	const jsonMiddleware = express.json();
	app.use(jsonMiddleware);

	app.use((req, res, next) => {
		res.header('Access-Control-Allow-Origin', 'http://localhost:5000');
		res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
		res.header('Access-Control-Allow-Headers', 'Content-Type');
		next();
	});

	app.listen(port, () => {
		console.log(`Server running on port ${port}`);
	});

	return app;
}
