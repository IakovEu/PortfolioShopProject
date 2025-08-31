import axios from 'axios';
import { IProduct, IProductFilterPayload, similarProduct } from '@shared/types';
import { IProductEditData } from '../types';

export async function getProducts() {
	const host = `http://${process.env.LOCAL_PATH}:${process.env.LOCAL_PORT}/${process.env.API_PATH}`;
	const { data } = await axios.get<IProduct[]>(`${host}/products`);
	return data || [];
}

export async function searchProducts(
	filter: IProductFilterPayload
): Promise<IProduct[]> {
	const host = `http://${process.env.LOCAL_PATH}:${process.env.LOCAL_PORT}/${process.env.API_PATH}`;
	const { data } = await axios.get<IProduct[]>(`${host}/products/search`, {
		params: filter,
	});
	return data || [];
}

export async function getProduct(id: string): Promise<IProduct | null> {
	const host = `http://${process.env.LOCAL_PATH}:${process.env.LOCAL_PORT}/${process.env.API_PATH}`;
	try {
		const { data } = await axios.get<IProduct>(`${host}/products/${id}`);
		return data;
	} catch (e) {
		return null;
	}
}

export async function removeProduct(id: string): Promise<void> {
	const host = `http://${process.env.LOCAL_PATH}:${process.env.LOCAL_PORT}/${process.env.API_PATH}`;
	await axios.delete(`${host}/products/remove-product/${id}`);
}

export async function getSimilarProduct(id: string) {
	const host = `http://${process.env.LOCAL_PATH}:${process.env.LOCAL_PORT}/${process.env.API_PATH}`;
	try {
		const { data } = await axios.get<similarProduct[]>(
			`${host}/products/similar/${id}`
		);
		return data;
	} catch (e) {
		return null;
	}
}

export async function createProduct(res: {
	title: string;
	description: string | null;
	price: string | null;
}) {
	const host = `http://${process.env.LOCAL_PATH}:${process.env.LOCAL_PORT}/${process.env.API_PATH}`;
	try {
		const { data } = await axios.post(
			`${host}/products`,
			res
		);
		return data;
	} catch (e) {
		return null;
	}
}

function splitNewImages(str = ''): string[] {
	return str
		.split(/\r\n|,/g)
		.map((url) => url.trim())
		.filter((url) => url);
}

function compileIdsToRemove(data: string | string[]): string[] {
	if (typeof data === 'string') return [data];
	return data;
}

export async function updateProduct(
	productId: string,
	formData: IProductEditData
): Promise<void> {
	const host = `http://${process.env.LOCAL_PATH}:${process.env.LOCAL_PORT}/${process.env.API_PATH}`;
	try {
		const { data: currentProduct } = await axios.get<IProduct>(
			`${host}/products/${productId}`
		);

		if (formData.commentsToRemove) {
			const commentsIdsToRemove = compileIdsToRemove(formData.commentsToRemove);

			const getDeleteCommentActions = () =>
				commentsIdsToRemove.map((commentId) => {
					return axios.delete(`${host}/comments/${commentId}`);
				});

			await Promise.all(getDeleteCommentActions());
		}

		if (formData.imagesToRemove) {
			const imagesIdsToRemove = compileIdsToRemove(formData.imagesToRemove);
			await axios.post(`${host}/products/remove-images`, imagesIdsToRemove);
		}

		if (formData.newImages) {
			const urls = splitNewImages(formData.newImages);
			const images = urls.map((url) => ({ url, main: false }));

			if (!currentProduct.thumbnail) {
				images[0].main = true;
			}

			await axios.post(`${host}/products/add-images`, { productId, images });
		}

		if (
			formData.mainImage &&
			formData.mainImage !== currentProduct.thumbnail?.id
		) {
			await axios.post(`${host}/products/update-thumbnail/${productId}`, {
				newThumbnailId: formData.mainImage,
			});
		}

		await axios.patch(`${host}/products/${productId}`, {
			title: formData.title,
			description: formData.description,
			price: Number(formData.price),
		});

		// Тут про добавление и удаление похожих товаров
		const allProducts = await getProducts();

		if (formData.similarToAdd && formData.similarToAdd.length > 0) {
			const prod = allProducts.filter((el) =>
				formData.similarToAdd?.includes(el.id)
			);

			const getPairs = prod.map((el) => ({
				product_id: el.id,
				title: el.title,
				description: el.description,
				price: el.price,
				related_product_id: productId,
			}));

			await axios.post(`${host}/products/similar/add`, {
				pairs: getPairs,
			});
		}

		if (formData.similarToRemove && formData.similarToRemove.length > 0) {
			if (Array.isArray(formData.similarToRemove)) {
				await axios.delete(`${host}/products/similar/remove/${productId}`, {
					data: { ids: formData.similarToRemove },
				});
			} else {
				await axios.delete(`${host}/products/similar/remove/${productId}`, {
					data: { ids: [formData.similarToRemove] },
				});
			}
		}
	} catch (e) {
		console.log(e);
	}
}
