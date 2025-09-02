import type { IProduct } from '../types';
import st from './styles.module.scss';
import prodImg from '../../public/product-placeholder.png';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export const ProductsListPage = ({
	products,
}: {
	products: IProduct[] | null;
}) => {
	const [search, setSearch] = useState('');
	const [minPrice, setMinPrice] = useState('');
	const [maxPrice, setMaxPrice] = useState('');

	const filteredProducts = products?.filter((product) => {
		const matchesName = product.title
			.toLowerCase()
			.includes(search.toLowerCase());
		const price = product.price;

		const min = minPrice ? parseFloat(minPrice) : -Infinity;
		const max = maxPrice ? parseFloat(maxPrice) : Infinity;

		const matchesPrice = price >= min && price <= max;

		return matchesName && matchesPrice;
	});

	return (
		<>
			<header>
				<h1 className={st.title}>
					Список товаров ({filteredProducts ? filteredProducts.length : 0})
				</h1>
			</header>
			<main className={st.main}>
				<div className={st.filters}>
					<input
						className={st.input}
						type="text"
						placeholder="Поиск по названию"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<input
						className={st.input}
						type="number"
						placeholder="Цена от"
						value={minPrice}
						onChange={(e) => setMinPrice(e.target.value)}
						min="0"
					/>
					<input
						className={st.input}
						type="number"
						placeholder="Цена до"
						value={maxPrice}
						onChange={(e) => setMaxPrice(e.target.value)}
						min="0"
					/>
				</div>

				<div className={st.products}>
					{filteredProducts?.map((el, ind) => (
						<div className={st.product} key={ind}>
							<Link to={`/product/${el.id}`} className={st.link}>
								<h2 className={st.productTitle}>{el.title}</h2>
								<img className={st.img} src={prodImg} alt="*" />
							</Link>
							<div>Цена: {el.price} руб.</div>
							<div className={st.comments}>
								Комментариев: {el.comments?.length || 0}
							</div>
						</div>
					))}
					{filteredProducts?.length === 0 && <p>Товары не найдены</p>}
				</div>
			</main>
		</>
	);
};
