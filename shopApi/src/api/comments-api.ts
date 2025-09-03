import { Request, Response, Router } from 'express';
import { IComment } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';
import { ICommentEntity, CommentCreatePayload } from '../../types';
import { connection } from '../../index.js'; // Проверить!
import { mapCommentsEntity } from '../services/mapping.js';
import {
	COMMENT_DUPLICATE_QUERY,
	INSERT_COMMENT_QUERY,
} from '../services/queries.js';
import { OkPacket } from 'mysql2';
import { validateComment } from '../helpers.js';
import { param, validationResult } from 'express-validator';

// Необходим для роутинга (прибавляется к пути в index.ts)
export const commentsRouter = Router();

commentsRouter.get('/', async (req: Request, res: Response) => {
	// Гет запрос по всем комментариям
	// Делаем запрос к БД
	try {
		const [comments] = await connection!.query<ICommentEntity[]>(
			'SELECT * FROM comments'
		);
		// Устанавливаем заголовок ответа клиенту
		res.setHeader('Content-Type', 'application/json');
		// Отправляем данные клиенту
		res.send(mapCommentsEntity(comments));
	} catch (e) {
		// Выводим сообщения для отладки
		console.debug((e as Error).message);
		// Уведомляем об ошибке на сервере
		res.status(500);
		res.send('Something went wrong');
	}
});

// Запрос конкретного коммента по id
commentsRouter.get(
	'/:id',
	[param('id').isUUID().withMessage('Comment id is not UUID')],
	async (req: Request<{ id: string }>, res: Response) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				res.status(400);
				res.json({ errors: errors.array() });
				return;
			}
			const [rows] = await connection!.query<ICommentEntity[]>(
				'SELECT * FROM comments WHERE product_id = ?',
				[req.params.id]
			);

			if (!rows?.[0]) {
				res.status(404);
				res.send(`Comment with id ${req.params.id} is not found`);
				return;
			}

			res.setHeader('Content-Type', 'application/json');
			res.send(mapCommentsEntity(rows));
		} catch (e) {
			console.debug((e as Error).message);
			res.status(500);
			res.send('Something went wrong');
		}
	}
);

// Пост запрос
commentsRouter.post(
	'/',
	async (req: Request<{}, {}, CommentCreatePayload>, res: Response) => {
		const validationResult = validateComment(req.body);

		if (validationResult) {
			res.status(400);
			res.send(validationResult);
			return;
		}

		try {
			const { name, email, body, productId } = req.body;
			// Делаем запрос на сервер
			const [sameResult] = await connection!.query<ICommentEntity[]>(
				COMMENT_DUPLICATE_QUERY,
				[email.toLowerCase(), name.toLowerCase(), body.toLowerCase(), productId]
			);
			// Проверяем не одинаковый ли это запрос
			if (sameResult.length) {
				res.status(422);
				res.send('Comment with the same fields already exists');
				return;
			}

			// Добавляем уникальный айди и отправляем в БД
			const id = uuidv4();
			await connection!.query<OkPacket>(INSERT_COMMENT_QUERY, [
				id,
				email,
				name,
				body,
				productId,
			]);

			res.status(201);
			res.send(`Comment id:${id} has been added!`);
		} catch (e) {
			console.debug((e as Error).message);
			res.status(500);
			res.send('Server error. Comment has not been created');
		}
	}
);

// Патч запрос обновляем данные или создаем новый коммент
commentsRouter.patch(
	'/',
	async (req: Request<{}, {}, Partial<IComment>>, res: Response) => {
		try {
			let updateQuery = 'UPDATE comments SET ';

			const valuesToUpdate = [];
			['name', 'body', 'email'].forEach((fieldName) => {
				if (req.body.hasOwnProperty(fieldName)) {
					if (valuesToUpdate.length) {
						updateQuery += ', ';
					}

					updateQuery += `${fieldName} = ?`;
					valuesToUpdate.push(req.body[fieldName as keyof IComment]);
				}
			});

			updateQuery += ' WHERE comment_id = ?';
			valuesToUpdate.push(req.body.id);

			const [info] = await connection!.query<OkPacket>(
				updateQuery,
				valuesToUpdate
			);

			if (info.affectedRows === 1) {
				res.status(200);
				res.send('Well done!');
				return;
			}

			const newComment = req.body as CommentCreatePayload;
			const validationResult = validateComment(newComment);

			if (validationResult) {
				res.status(400);
				res.send(validationResult);
				return;
			}

			const id = uuidv4();
			await connection!.query<OkPacket>(INSERT_COMMENT_QUERY, [
				id,
				newComment.email,
				newComment.name,
				newComment.body,
				newComment.productId,
			]);

			res.status(201);
			res.send({ ...newComment, id });
		} catch (e) {
			console.log((e as Error).message);
			res.status(500);
			res.send('Server error');
		}
	}
);

// Удаление конкретного коммента по id
commentsRouter.delete(
	'/:id',
	async (req: Request<{ id: string }>, res: Response) => {
		try {
			const [info] = await connection!.query<OkPacket>(
				'DELETE FROM comments WHERE comment_id = ?',
				[req.params.id]
			);

			if (info.affectedRows === 0) {
				res.status(404);
				res.send(`Comment with id ${req.params.id} is not found`);
				return;
			}

			res.status(200);
			res.send('Удалён нахуй!');
		} catch (e) {
			console.log((e as Error).message);
			res.status(500);
			res.send('Server error. Comment has not been deleted');
		}
	}
);
