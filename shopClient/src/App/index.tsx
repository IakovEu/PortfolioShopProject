import st from './styles.module.scss';
import { AllPathes } from '../AllPathes';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../../reducers/store';

function App() {
	return (
		<Provider store={store}>
			<div className={st.layout}>
				<BrowserRouter>
					<AllPathes />
				</BrowserRouter>
			</div>
		</Provider>
	);
}

export default App;
