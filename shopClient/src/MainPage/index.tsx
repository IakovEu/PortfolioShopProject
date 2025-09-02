import type { IProduct } from '../types';
import st from './styles.module.scss';
import { useNavigate } from 'react-router-dom';

export const MainPage = ({ products }: { products: IProduct[] | null }) => {
	const navigate = useNavigate();
	const price = products?.reduce((acc, el) => (acc += el.price), 0);

	return (
		<>
			<header>
				<h1 className={st.title}>Shop client</h1>
			</header>
			<main className={st.main}>
				<div className={st.text}>
					В базе данных находится {products ? products.length : 0} товаров общей
					стоимостью {price || 0}
				</div>
				<div className={st.btns}>
					<button
						className={st.list}
						onClick={() => {
							navigate('/products-list');
						}}>
						Перейти к списку товаров
					</button>
					<button className={st.system}>
						Перейти в систему администрирования
					</button>
				</div>
			</main>
		</>
	);
};
