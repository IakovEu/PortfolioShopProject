import axios from 'axios';
import { IProduct, IProductFilterPayload } from '@shared/types';
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
	await axios.delete(`${host}/products/${id}`);
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
			/**
			 * formData.commentsToRemove может содержать как строку с одним значением,
			 * так и массив значений, поэтому используется хелпер compileIdsToRemove,
			 * который в итоге выдаст массив строк
			 */
			const commentsIdsToRemove = compileIdsToRemove(formData.commentsToRemove);

			/**
			 * создаем функцию, которая при вызове выдаст массив из вызовов обращений к API
			 */
			const getDeleteCommentActions = () =>
				commentsIdsToRemove.map((commentId) => {
					return axios.delete(`${host}/comments/${commentId}`);
				});

			/**
			 * вызываем функцию с обращениями к API, все запросы запустятся одновременно
			 */
			await Promise.all(getDeleteCommentActions());

			/**
			 * пояснение к Promise.all – это один из вариантов того,
			 * как можно удалять комментарии по одному
			 *
			 * Comments API не имеет метода удаления нескольких комментариев единовременно
			 *
			 * если вам такой способ неудобен, вы можете реализовать дополнительный
			 * метод в Comments API для удаления нескольких комментариев за один вызов
			 *
			 * такой метод можно реализовать по аналогии с POST /api/products/remove-images
			 */
		}

		if (formData.imagesToRemove) {
			/**
			 * используем хелпер compileIdsToRemove по аналогии с commentsToRemove
			 */
			const imagesIdsToRemove = compileIdsToRemove(formData.imagesToRemove);
			await axios.post(`${host}/products/remove-images`, imagesIdsToRemove);
		}

		if (formData.newImages) {
			/**
			 * превращаем строку с массив строк
			 */
			const urls = splitNewImages(formData.newImages);

			/**
			 * согласно типу Request body ProductAddImagesPayload /api/add-images,
			 * нам нужно передать объект с полями productId и images,
			 * где images это массив объектов с полями url и main
			 *
			 * все новые картинки мы помечаем как картинки не для обложки,
			 * поэтому main: false
			 */
			const images = urls.map((url) => ({ url, main: false }));

			/**
			 * если у данного товара еще нет обложки,
			 * то первое изображение из массива images мы установим как обложку товара
			 */
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

		/**
		 * обновление полей title, description и price в текущем товаре;
		 * price из формы приходит в виде строки, поэтому нужно превратить его в число
		 */
		await axios.patch(`${host}/products/${productId}`, {
			title: formData.title,
			description: formData.description,
			price: Number(formData.price),
		});
	} catch (e) {
		console.log(e);
	}
}
