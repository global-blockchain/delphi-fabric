const {get, put, cross, whoami, getEndorsement, putEndorsement} = require('./diagnoseInvoke');
const logger = require('../../common/nodejs/logger').new('invoke:diagnose', true);
const helper = require('../../app/helper');

const DRInstall = require('./diagnoseInstall');
const flow = async () => {
	await DRInstall.task();
	const org1 = 'icdd';
	const org2 = 'ASTRI.org';
	let peers = [helper.newPeer(0, org1), helper.newPeer(0, org2)];
	const clientOrg = org2;
	const key = 'a';
	await put(peers, clientOrg, key, 'b');
	const gotValue = await get(peers, clientOrg, key);
	logger.debug('got value', gotValue);

	const cid = await whoami(peers, org1);
	logger.info({cid});
	const endorseKey = key;
	await putEndorsement(peers, org1, endorseKey, ['ASTRIMSP', 'icddMSP']);
	let endorsingOrgs = await getEndorsement(peers, clientOrg, endorseKey);
	logger.info(endorsingOrgs);
	try {
		peers = helper.newPeers([0], org1);
		await put(peers, org1, key, 'endorsing hack');
		logger.error('expect endorsing error');
	} catch (e) {
		logger.info('expect endorsing error', e);
	}
	peers = [helper.newPeer(0, org1), helper.newPeer(0, org2)];
	await put(peers, org1, key, 'endorsing good');
};
const flowAttach = async () => {
	await DRInstall.taskAttach();
	const org1 = 'icdd';
	const org2 = 'ASTRI.org';
	const peers = helper.newPeers([0], org1);
	try {
		await cross(peers, org1, 'mainChain', 'put', ['a', 'avalueFromAttacker']);
	} catch (err) {
		logger.info('expected endorse error', err);
	}
	// try call an not existing chaincode
	try {
		await cross(peers, org1, 'master', 'increase');
	} catch (err) {
		logger.info('expect not exist error', err);
	}
};
flow();
