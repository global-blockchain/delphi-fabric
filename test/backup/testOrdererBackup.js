const {
	containerDelete,
} = require('../../common/docker/nodejs/dockerode-util');
const {
	runOrderer
} = require('../../common/nodejs/fabric-dockerode');
const logger = require('khala-nodeutils/logger').new('test orderer HA');
const {sleep, homeResolve} = require('khala-nodeutils/helper');
const globalConfig = require('../../config/orgs');
const {CryptoPath} = require('../../common/nodejs/path');
const peerUtil = require('../../common/nodejs/peer');
const org = 'ICDD.ASTRI.org';
const {fabricTag, network} = globalConfig.docker;
const imageTag = `${fabricTag}`;
const targetOrderer = 'orderer2';

const {MSPROOT} = peerUtil.container;
const cryptoPath = new CryptoPath(MSPROOT, {
	orderer: {org, name: targetOrderer}
});
const flow = async () => {
	const ordererConfig = globalConfig.orderer.kafka.orgs[org];
	let {portHost, stateVolume} = ordererConfig.orderers[targetOrderer];
	stateVolume = homeResolve(stateVolume);
	const {file} = globalConfig.orderer.genesis_block;
	const container_name = cryptoPath.ordererHostName;
	await containerDelete(container_name);

	const {mspid} = ordererConfig;
	await sleep(10000);
	const configPath = cryptoPath.MSP('orderer');
	await runOrderer({
		container_name, imageTag, port: portHost, network, BLOCK_FILE: file, CONFIGTXVolume: 'CONFIGTX',
		msp: {
			id: mspid,
			configPath,
			volumeName: 'MSPROOT'
		},
		kafkas: true,
		tls: false,
		stateVolume
	});
};
flow();
