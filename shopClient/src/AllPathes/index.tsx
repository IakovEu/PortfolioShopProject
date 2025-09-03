import { MainPage } from '../MainPage';
import { Route, Routes } from 'react-router-dom';
import { NotFound } from '../NotFound';
import { ProductsListPage } from '../ProductsListPage';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import type { RootDispatch } from '../../reducers/store';
import { setNew } from '../../reducers/productsSlice';
import { ProductPage } from '../ProductPage';

export const AllPathes = () => {
	const dispatch = useDispatch<RootDispatch>();
	const [loading, setLoading] = useState(true);

	console.log(loading);

	useEffect(() => {
		axios
			.get('http://localhost:3000/api/products')
			.then((response) => {
				setLoading(false);
				dispatch(setNew(response.data));
			})
			.catch((err) => {
				console.log(err.message);
				setLoading(false);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Routes>
			<Route path="/" element={<MainPage />}></Route>
			<Route path="/products-list" element={<ProductsListPage />}></Route>
			<Route path="/product/:id" element={<ProductPage />}></Route>
			<Route path="*" element={<NotFound />} />
		</Routes>
	);
};
