import dotenv from 'dotenv';
dotenv.config();
import { Express } from 'express';
import { Connection } from 'mysql2/promise';
import { initDataBase } from './server/services/db.js';
import { initServer } from './server/services/server.js';
import shopApi from './shopApi/index.js';
import shopAdmin from './shopAdmin/index.js';
import { initSocketServer } from './server/services/socket.js';
import { Server } from 'socket.io';

export let server: Express;
export let connection: Connection | null;
export let ioServer: Server;

async function launchApplication() {
	server = initServer();
	connection = await initDataBase();
	ioServer = initSocketServer(server);
	initRouter();
}

function initRouter() {
	server.use('/api', shopApi(connection!));
	server.use('/admin', shopAdmin());
	server.use('/', (_, res) => {
		res.send('React App');
	});
}

launchApplication();
