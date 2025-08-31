import express, { Express } from 'express';
import { productsRouter } from './controllers/productsConroller.js';
import layouts from 'express-ejs-layouts';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { authRouter, validateSession } from './controllers/authController.js';
import session from 'express-session';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default function shopAdmin(): Express {
	const app = express();

	app.use(
		session({
			secret: process.env.SESSION_SECRET!,
			saveUninitialized: false,
			resave: false,
		})
	);

	app.use(express.json());
	app.use(bodyParser.urlencoded({ extended: false }));

	// Установка шаблонизатора
	app.set('view engine', 'ejs');
	app.set('views', 'shopAdmin/views');
	app.use((req, res, next) => {
		res.locals.showAddProduct = true;
		res.locals.showBackToAllProducts = false;
		next();
	});
	// Поиск макета в который будет встраиваться отсальной ejs
	app.use(layouts);

	app.use(express.static(__dirname + '/public'));

	app.use(validateSession);
	app.use('/auth', authRouter);
	app.use('/', productsRouter);

	return app;
}
