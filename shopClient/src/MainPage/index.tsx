import { useSelector } from 'react-redux';
import type { RootState } from '../../reducers/store';
import st from './styles.module.scss';
import { useNavigate } from 'react-router-dom';

export const MainPage = () => {
	const products = useSelector((state: RootState) => state.products).products;
	const navigate = useNavigate();
	const price = products?.reduce((acc, el) => (acc += el.price), 0);

	console.log(products);
	
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
						<a
							className={st.link}
							href="http://localhost:3000/admin/auth/login"
							target="blanc">
							Перейти в систему администрирования
						</a>
					</button>
				</div>
			</main>
		</>
	);
};
