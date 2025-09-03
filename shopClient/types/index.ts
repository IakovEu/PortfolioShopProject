export interface IProduct {
	id: string;
	title: string;
	description: string;
	price: number;
	thumbnail?: IProductImage;
	comments?: IComment[];
	images?: IProductImage[];
}

export interface IProductImage {
	id: string;
	productId: string;
	main: boolean;
	url: string;
}

export interface IComment {
	id: string;
	name: string;
	email: string;
	body: string;
	productId: string;
}

export interface Similar {
	description: string;
	id: number;
	price: string;
	product_id: string;
	related_product_id: string;
	title: string;
}
