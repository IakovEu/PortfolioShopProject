import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { Express } from 'express';
import { Connection } from 'mysql2/promise';
import { initDataBase } from './server/services/db.js';
import { initServer } from './server/services/server.js';
import shopApi from './shopApi/index.js';
import shopAdmin from './shopAdmin/index.js';
import { initSocketServer } from './server/services/socket.js';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export let server: Express;
export let connection: Connection | null;
export let ioServer: Server;

async function launchApplication() {
	server = initServer();
	connection = await initDataBase();
	ioServer = initSocketServer(server);
	server.use(express.static(path.resolve(__dirname, 'shopClient/dist')));
	initRouter();
}

function initRouter() {
	server.use('/api', shopApi(connection!));
	server.use('/admin', shopAdmin());
	// server.get('*', (req, res) => {
	// 	res.sendFile(path.resolve(__dirname, 'shopClient/dist', 'index.html'));
	// });
}

launchApplication();
