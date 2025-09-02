import { MainPage } from '../MainPage';
import { Route, Routes } from 'react-router-dom';
import { NotFound } from '../NotFound';
import { ProductsListPage } from '../ProductsListPage';
import { useEffect, useState } from 'react';
import axios from 'axios';
import type { IProduct } from '../types';

export const AllPathes = () => {
	const [products, setProducts] = useState<IProduct[] | null>(null);
	const [loading, setLoading] = useState(true);

	console.log(loading);

	useEffect(() => {
		axios
			.get('http://localhost:3000/api/products')
			.then((response) => {
				setProducts(response.data);
				setLoading(false);
			})
			.catch((err) => {
				console.log(err.message);
				setLoading(false);
			});
	}, []);

	return (
		<Routes>
			<Route path="/" element={<MainPage products={products} />}></Route>
			<Route
				path="/products-list"
				element={<ProductsListPage products={products} />}></Route>
			<Route path="/product/:id"></Route>
			<Route path="*" element={<NotFound />} />
		</Routes>
	);
};
