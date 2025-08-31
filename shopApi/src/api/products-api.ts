import { Request, Response, Router } from 'express';
import { connection } from '../../index.js';
import { v4 as uuidv4 } from 'uuid';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { ioServer } from '../../../index.js';
import { body, param, validationResult } from 'express-validator';
import {
	enhanceProductsComments,
	enhanceProductsImages,
	getProductsFilterQuery,
} from '../helpers.js';
import {
	AddPairsRequest,
	ICommentEntity,
	ImagesRemovePayload,
	IProductEntity,
	IProductImageEntity,
	IProductSearchFilter,
	ProductAddImagesPayload,
	ProductCreatePayload,
} from '../../types';
import {
	mapCommentsEntity,
	mapImagesEntity,
	mapProductsEntity,
} from '../services/mapping.js';
import {
	DELETE_IMAGES_QUERY,
	INSERT_MANY_QUERIES,
	INSERT_PRODUCT_IMAGES_QUERY,
	INSERT_PRODUCT_QUERY,
} from '../services/queries.js';
import { IProduct } from '@shared/types.js';

export const productsRouter = Router();

const throwServerError = (res: Response, e: Error) => {
	console.debug(e.message);
	res.status(500);
	res.send('Something went wrong');
};

productsRouter.get('/', async (req: Request, res: Response) => {
	try {
		const [productRows] = await connection!.query<IProductEntity[]>(
			'SELECT * FROM products'
		);
		const [commentRows] = await connection!.query<ICommentEntity[]>(
			'SELECT * FROM comments'
		);
		const [imageRows] = await connection!.query<IProductImageEntity[]>(
			'SELECT * FROM images'
		);

		const products = mapProductsEntity(productRows);
		const withComments = enhanceProductsComments(products, commentRows);
		const withImages = enhanceProductsImages(withComments, imageRows);

		res.send(withImages);
	} catch (e) {
		throwServerError(res, e as Error);
	}
});

productsRouter.get(
	'/search',
	async (req: Request<{}, {}, {}, IProductSearchFilter>, res: Response) => {
		try {
			const [query, values] = getProductsFilterQuery(req.query);
			const [rows] = await connection!.query<IProductEntity[]>(query, values);

			if (!rows?.length) {
				res.send([]);
				return;
			}

			const [commentRows] = await connection!.query<ICommentEntity[]>(
				'SELECT * FROM comments'
			);
			const [imageRows] = await connection!.query<IProductImageEntity[]>(
				'SELECT * FROM images'
			);

			const products = mapProductsEntity(rows);
			const withComments = enhanceProductsComments(products, commentRows);
			const withImages = enhanceProductsImages(withComments, imageRows);

			res.send(withImages);
		} catch (e) {
			throwServerError(res, e as Error);
		}
	}
);

productsRouter.get(
	'/:id',
	async (req: Request<{ id: string }>, res: Response) => {
		try {
			const [rows] = await connection!.query<IProductEntity[]>(
				'SELECT * FROM products WHERE product_id = ?',
				[req.params.id]
			);

			if (!rows?.[0]) {
				res.status(404);
				res.send(`Product with id ${req.params.id} is not found`);
				return;
			}

			const [comments] = await connection!.query<ICommentEntity[]>(
				'SELECT * FROM comments WHERE product_id = ?',
				[req.params.id]
			);

			const [images] = await connection!.query<IProductImageEntity[]>(
				'SELECT * FROM images WHERE product_id = ?',
				[req.params.id]
			);

			const product = mapProductsEntity(rows)[0];

			if (comments.length) {
				product.comments = mapCommentsEntity(comments);
			}

			if (images.length) {
				product.images = mapImagesEntity(images);
				product.thumbnail =
					product.images!.find((image) => image.main) || product.images![0];
			}

			res.send(product);
		} catch (e) {
			throwServerError(res, e as Error);
		}
	}
);

productsRouter.post(
	'/',
	async (
		req: Request<{}, {}, ProductCreatePayload>,
		res: Response<IProduct>
	) => {
		try {
			const { title, description, price, images } = req.body;
			const productId = uuidv4();
			await connection!.query<ResultSetHeader>(INSERT_PRODUCT_QUERY, [
				productId,
				title || null,
				description || null,
				price || null,
			]);

			if (images) {
				const values = images.map((image) => [
					uuidv4(),
					image.url,
					productId,
					image.main,
				]);
				await connection!.query<ResultSetHeader>(INSERT_PRODUCT_IMAGES_QUERY, [
					values,
				]);
			}

			const [products] = await connection.query<RowDataPacket[]>(
				'SELECT * FROM products'
			);
			ioServer.emit('update products count', products?.length || 0);
			res.status(201);
			res.send({
				id: productId,
				title: title,
				description: description,
				price: price,
			});
		} catch (e) {
			throwServerError(res, e as Error);
		}
	}
);

productsRouter.delete(
	'/remove-product/:id',
	async (req: Request<{ id: string }>, res: Response) => {
		try {
			const [rows] = await connection!.query<IProductEntity[]>(
				'SELECT * FROM products WHERE product_id = ?',
				[req.params.id]
			);

			if (!rows?.[0]) {
				res.status(404);
				res.send(`Product with id ${req.params.id} is not found`);
				return;
			}

			await connection!.query<ResultSetHeader>(
				'DELETE FROM similar_products WHERE related_product_id = ? OR product_id = ?',
				[req.params.id, req.params.id]
			);

			await connection!.query<ResultSetHeader>(
				'DELETE FROM images WHERE product_id = ?',
				[req.params.id]
			);

			await connection!.query<ResultSetHeader>(
				'DELETE FROM comments WHERE product_id = ?',
				[req.params.id]
			);

			await connection!.query<ResultSetHeader>(
				'DELETE FROM products WHERE product_id = ?',
				[req.params.id]
			);

			res.status(200);
			res.end();
		} catch (e) {
			throwServerError(res, e as Error);
		}
	}
);

productsRouter.post(
	'/add-images',
	async (req: Request<{}, {}, ProductAddImagesPayload>, res: Response) => {
		try {
			const { productId, images } = req.body;

			if (!images?.length) {
				res.status(400);
				res.send('Images array is empty');
				return;
			}

			const values = images.map((image) => [
				uuidv4(),
				image.url,
				productId,
				image.main,
			]);
			await connection!.query<ResultSetHeader>(INSERT_PRODUCT_IMAGES_QUERY, [
				values,
			]);

			res.status(201);
			res.send(`Images for a product id:${productId} have been added!`);
		} catch (e) {
			throwServerError(res, e as Error);
		}
	}
);

productsRouter.post(
	'/remove-images',
	async (req: Request<{}, {}, ImagesRemovePayload>, res: Response) => {
		try {
			const imagesToRemove = req.body;

			if (!imagesToRemove?.length) {
				res.status(400);
				res.send('Images array is empty');
				return;
			}

			const [info] = await connection!.query<ResultSetHeader>(
				DELETE_IMAGES_QUERY,
				[[imagesToRemove]]
			);

			if (info.affectedRows === 0) {
				res.status(404);
				res.send('No one image has been removed');
				return;
			}

			res.status(200);
			res.send(`Images have been removed!`);
		} catch (e) {
			throwServerError(res, e as Error);
		}
	}
);

// получение списка «похожих товаров» для конкретного товара

productsRouter.get(
	'/similar/:id',
	param('id').notEmpty().withMessage('ID не должен быть пустым'),
	async (req: Request<{ id: string }>, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			const [rows] = await connection!.query<IProductEntity[]>(
				'SELECT * FROM similar_products WHERE related_product_id = ?',
				[req.params.id]
			);

			if (!rows?.[0]) {
				res.status(404);
				res.send(`Product with id ${req.params.id} has not similar products`);
				return;
			}

			res.send(rows);
		} catch (e) {
			throwServerError(res, e as Error);
		}
	}
);

// добавление «похожих товаров» (я не хочу делать маппинг и использую наименования, как в таблице)
// по заданию я не понял, надо добавлять поля с описанием и тд. в новую таблицу или нет (на всякий случай добавил)
productsRouter.post(
	'/similar/add',
	body('pairs')
		.isArray({ min: 1 })
		.withMessage(
			'Параметр pairs должен быть массивом с минимум одним элементом'
		),
	body('pairs.*.product_id')
		.isString()
		.withMessage('product_id должен быть строкой'),

	body('pairs.*.title')
		.optional()
		.isString()
		.withMessage('title должен быть строкой'),

	body('pairs.*.description')
		.optional()
		.isString()
		.withMessage('description должен быть строкой'),

	body('pairs.*.price')
		.optional()
		.isNumeric()
		.withMessage('price должен быть числом'),

	body('pairs.*.related_product_id')
		.isString()
		.withMessage('related_product_id должен быть строкой'),
	async (req: Request<{}, {}, AddPairsRequest>, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			const { pairs } = req.body;

			const values = pairs.map((pair) => [
				pair.product_id,
				pair.title || null,
				pair.description || null,
				pair.price || null,
				pair.related_product_id,
			]);

			await connection!.query(INSERT_MANY_QUERIES, [values]);

			res.status(200).send('Pairs added successfully');
		} catch (e) {
			throwServerError(res, e as Error);
		}
	}
);

// удаление связей «похожих товаров»

productsRouter.delete(
	'/similar/remove/:id',
	body('ids').isArray({ min: 1 }).withMessage('Должен быть передан массив ID'),
	async (req: Request<{ id: string }>, res: Response) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		try {
			const relatedProductId = req.params.id; // ID из URL
			const productIds: string[] = req.body.ids; // массив product_id из тела запроса

			// Проверка, есть ли такие связи
			const [rows] = await connection!.query<IProductEntity[]>(
				'SELECT * FROM similar_products WHERE related_product_id = ? AND product_id IN (?)',
				[relatedProductId, productIds]
			);

			if (!rows?.length) {
				return res
					.status(404)
					.json({ message: 'Похожие товары для указанных ID не найдены' });
			}

			// Удаление выбранных связей
			const [result] = await connection!.query<ResultSetHeader>(
				'DELETE FROM similar_products WHERE related_product_id = ? AND product_id IN (?)',
				[relatedProductId, productIds]
			);

			res
				.status(200)
				.json({ message: `Удалено ${result.affectedRows} похожих товара(ов)` });
		} catch (e) {
			throwServerError(res, e as Error);
		}
	}
);
