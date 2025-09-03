import { useSelector } from 'react-redux';
import st from './styles.module.scss';
import { useLocation } from 'react-router-dom';
import type { RootState } from '../../reducers/store';
import prodImg from '../../public/product-placeholder.png';
import { useEffect, useState } from 'react';
import axios from 'axios';
import type { Similar } from '../../types';

type Comment = {
	name: string;
	email: string;
	body: string;
};

export const ProductPage = () => {
	const location = useLocation();
	const currentId = location.pathname.replaceAll('/product/', '');
	const products = useSelector((state: RootState) => state.products).products;
	const myProd = products?.filter((el) => el.id === currentId)[0];
	const [similar, setSimilar] = useState<Similar[] | null>(null);
	const [comments, setComments] = useState<Comment[]>(myProd?.comments || []);

	// Поля формы
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [body, setBody] = useState('');

	useEffect(() => {
		axios
			.get(`http://localhost:3000/api/products/similar/${currentId}`)
			.then((response) => {
				setSimilar(response.data);
			})
			.catch((err) => {
				console.log(err.message);
			});

		axios
			.get(`http://localhost:3000/api/comments/${currentId}`)
			.then((response) => {
				setComments(response.data);
			})
			.catch((err) => {
				console.log(err.message);
			});
	}, [currentId]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim() || !email.trim() || !body.trim()) {
			console.log('Пожалуйста, заполните все поля.');
			return;
		}

		try {
			const productId = currentId;
			// Отправляем комментарий на сервер
			console.log(name, email, body, productId);

			const response = await axios.post(`http://localhost:3000/api/comments`, {
				name,
				email,
				body,
				productId,
			});

			if (response.status === 200 || response.status === 201) {
				// Добавляем новый комментарий в локальный стейт
				setComments((prev) => [...prev, { name, email, body }]);
				// Очищаем форму
				setName('');
				setEmail('');
				setBody('');
			}
		} catch (error) {
			const e = error as Error;
			console.log(e.message);
		}
	};

	return (
		<>
			<header>
				<h2 className={st.title}>{myProd?.title}</h2>
			</header>
			<main className={st.main}>
				<div className={st.product}>
					<img className={st.img} src={prodImg} alt="*" />
					<div className={st.description}>{myProd?.description}</div>
					<div className={st.price}>Цена: {myProd?.price} руб.</div>
					<div className={st.similar}>
						<h3>Similar products:</h3>
						{similar ? (
							similar.map((el, ind) => (
								<div key={ind} className={st.similarProd}>
									<h4>{el.title}&nbsp; — &nbsp;</h4>
									<div>{el.price} руб.</div>
								</div>
							))
						) : (
							<div></div>
						)}
					</div>
					<div className={st.comments}>
						<h3>Комментарии:</h3>
						{comments.length > 0 ? (
							comments.map((el, ind) => (
								<div key={ind} className={st.comment}>
									<h4>
										{ind + 1}. {el.name}
									</h4>
									<p>{el.email}</p>
									<p>{el.body}</p>
								</div>
							))
						) : (
							<p>Комментариев пока нет.</p>
						)}
					</div>
					<form className={st.commentForm} onSubmit={handleSubmit}>
						<h3>Добавить комментарий:</h3>
						<div className={st.formGroup}>
							<label htmlFor="name">Имя:</label>
							<input
								id="name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>
						<div className={st.formGroup}>
							<label htmlFor="email">E-mail:</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div className={st.formGroup}>
							<label htmlFor="body">Текст комментария:</label>
							<textarea
								id="body"
								value={body}
								onChange={(e) => setBody(e.target.value)}
								required
							/>
						</div>
						<button type="submit" className={st.saveButton}>
							Сохранить
						</button>
						{status && <p className={st.statusMessage}>{status}</p>}
					</form>
				</div>
			</main>
		</>
	);
};
