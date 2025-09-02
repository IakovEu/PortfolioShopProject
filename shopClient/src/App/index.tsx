import st from './styles.module.scss';
import { AllPathes } from '../AllPathes';
import { BrowserRouter } from 'react-router-dom';

function App() {
	return (
		<div className={st.layout}>
			<BrowserRouter>
				<AllPathes />
			</BrowserRouter>
		</div>
	);
}

export default App;
