import { Router, Request, Response } from 'express';
import {
	getProduct,
	getProducts,
	getSimilarProduct,
	removeProduct,
	searchProducts,
	updateProduct,
} from '../models/productsModel.js';
import { IProductFilterPayload } from '@shared/types.js';
import { IProductEditData } from '../types';
import { throwServerError } from './helpers.js';

export const productsRouter = Router();

productsRouter.get('/', async (req: Request, res: Response) => {
	try {
		// В папке вьюс ищет файл продуктс.ежс
		// массив айтемс передается в файл ежс автоматически
		res.render('products', { items: await getProducts(), queryParams: {} });
	} catch (e) {
		throwServerError(res, e as Error);
	}
});

productsRouter.get(
	'/search',
	async (req: Request<{}, {}, {}, IProductFilterPayload>, res: Response) => {
		try {
			res.render('products', {
				items: await searchProducts(req.query),
				queryParams: req.query,
			});
		} catch (e) {
			throwServerError(res, e as Error);
		}
	}
);

productsRouter.get(
	'/:id',
	async (req: Request<{ id: string }>, res: Response) => {
		try {
			const product = await getProduct(req.params.id);
			const similarProducts = await getSimilarProduct(req.params.id);
			const allProducts = await getProducts();
			const similarIds = new Set(similarProducts?.map((el) => el.product_id));
			const filteredItems = allProducts.filter((el) => !similarIds.has(el.id));			

			if (product) {
				res.render('product/product', {
					item: product,
					items: filteredItems,
					currentId: req.params.id,
					similar: similarProducts,
				});
			} else {
				res.render('product/empty-product', {
					id: req.params.id,
				});
			}
		} catch (e) {
			throwServerError(res, e as Error);
		}
	}
);

productsRouter.get(
	'/remove-product/:id',
	async (
		req: Request<{ id: string }> & { session: { username?: string } },
		res: Response
	) => {
		try {
			if (req.session.username !== 'admin') {
				res.status(403);
				res.send('Forbidden');
				return;
			}
			await removeProduct(req.params.id);
			res.redirect(`/${process.env.ADMIN_PATH}`);
		} catch (e) {
			throwServerError(res, e as Error);
		}
	}
);

productsRouter.post(
	'/save/:id',
	async (req: Request<{ id: string }, {}, IProductEditData>, res: Response) => {
		try {
			await updateProduct(req.params.id, req.body);
			res.redirect(`/${process.env.ADMIN_PATH}/${req.params.id}`);
		} catch (e) {
			throwServerError(res, e as Error);
		}
	}
);
