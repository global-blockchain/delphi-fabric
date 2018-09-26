const {invoke} = require('./chaincodeHelper');
const {reducer} = require('../common/nodejs/chaincode');
const helper = require('./helper');

const logger = require('../common/nodejs/logger').new('testInvoke');
const chaincodeId = process.env.name ? process.env.name : 'stress';
const fcn = '';
const args = [];
const globalConfig = require('../config/orgs.json');
const {channels} = globalConfig;
const peerIndexes = [0];

const channelName = 'allchannel';


const {chaincodeEvent, newEventHub} = require('../common/nodejs/eventHub');

const {sleep} = require('../common/nodejs/helper');
const task = async () => {
	const org1 = 'icdd';
	const org2 = 'ASTRI.org';
	const peers = [helper.newPeers([0], org1)[0], helper.newPeers([0], org2)[0]];
	//try to use another user
	let orgName = helper.randomOrg('peer');
	logger.info('channel org', orgName);
	const client = await helper.getOrgAdmin(orgName);
	const channel = helper.prepareChannel(channelName, client, true);
	const transientMap = {testk: Buffer.from('testValue')};
	const {txEventResponses, proposalResponses} = await invoke(channel, peers, {chaincodeId, fcn, args, transientMap});
	const result = reducer({txEventResponses, proposalResponses});
	logger.info(result);
};
const getChaincodeEvent = async () => {
	const orgName = helper.randomOrg('peer');
	const chaincodeEventName = /event/i;
	const peers = helper.newPeers(peerIndexes, orgName);
	const client = await helper.getOrgAdmin(orgName);
	const channel = helper.prepareChannel(channelName, client, true);
	const eventHub = newEventHub(channel, peers[0], true);
	const validator = (data) => {
		logger.debug('default validator', data);
		return {valid: true, interrupt: false};
	};
	return chaincodeEvent(eventHub, validator, {chaincodeId, eventName: chaincodeEventName}, () => {
	}, (err) => {
		logger.error('onError', err);
	});
};
let eventHandler;
const run = async (times, interval = 1000) => {
	if (Number.isInteger(times)) {
		for (let i = 0; i < times; i++) {
			await task();
			await sleep(interval);
		}
	} else {
		// if (!eventHandler) {
		// 	eventHandler = await getChaincodeEvent();
		// }
		await task();
		await sleep(interval);
		await run(times, interval);
	}
};
run(process.env.times, process.env.interval);

