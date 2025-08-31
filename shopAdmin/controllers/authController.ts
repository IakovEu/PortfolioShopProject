import { Router, Request, Response, NextFunction } from 'express';
import { throwServerError } from './helpers.js';
import { IAuthRequisites } from '@shared/types';
import { verifyRequisites } from '../models/authModel.js';

export const authRouter = Router();

export const validateSession = (
	req: Request & { session: { username?: string } },
	res: Response,
	next: NextFunction
) => {
	if (req.path.includes('/login') || req.path.includes('/authenticate')) {
		next();
		return;
	}

	if (req.session?.username) {
		next();
	} else {
		res.redirect(`/${process.env.ADMIN_PATH}/auth/login`);
	}
};

authRouter.get('/login', async (req: Request, res: Response) => {
	try {
		res.locals.showAddProduct = false;
		res.render('login');
	} catch (e) {
		throwServerError(res, e as Error);
	}
});

authRouter.post(
	'/authenticate',
	async (
		req: Request<{}, {}, IAuthRequisites> & { session: { username?: string } },
		res: Response
	) => {
		try {
			const verified = await verifyRequisites(req.body);
			if (verified) {
				req.session.username = req.body.username;
				res.redirect(`/${process.env.ADMIN_PATH}`);
			} else {
				res.redirect(`/${process.env.ADMIN_PATH}/auth/login`);
			}
		} catch (e) {
			throwServerError(res, e as Error);
		}
	}
);

authRouter.get('/logout', async (req: Request, res: Response) => {
	try {
		req.session.destroy((e) => {
			if (e) {
				console.log('Something went wrong with session destroying', e);
			}

			res.redirect(`/${process.env.ADMIN_PATH}/auth/login`);
		});
	} catch (e) {
		throwServerError(res, e as Error);
	}
});
