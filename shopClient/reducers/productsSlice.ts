import { createSlice } from '@reduxjs/toolkit';
import type { IProduct } from '../types';

interface ProductsState {
	products: IProduct[] | null;
}

const initialState: ProductsState = {
	products: null,
};

export const productsSlice = createSlice({
	name: 'products',
	initialState,
	reducers: {
		setNew: (state, action) => {
			state.products = action.payload;
		},
	},
});

export const { setNew } = productsSlice.actions;
