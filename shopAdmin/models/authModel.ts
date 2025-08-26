import axios from 'axios';
import { IAuthRequisites } from '@shared/types';

export async function verifyRequisites(
	requisites: IAuthRequisites
): Promise<boolean> {
	try {
		const { status } = await axios.post(
			`http://${process.env.LOCAL_PATH}:${process.env.LOCAL_PORT}/${process.env.API_PATH}/auth`,
			requisites
		);

		return status === 200;
	} catch (e) {
		return false;
	}
}
