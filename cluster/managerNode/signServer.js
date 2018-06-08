const config = require('./nodeScripts/config');
const {port} = config.signServer;
const logger = require('../../common/nodejs/logger').new('sign server');
const {app} = require('../../common/nodejs/baseApp').run(port);
const Multer = require('multer');
const userUtil = require('../../common/nodejs/user');
const signUtil = require('../../common/nodejs/multiSign');
const clientUtil = require('../../common/nodejs/client');
const pathUtil = require('../../common/nodejs/path');
const {CryptoPath, homeResolve} = pathUtil;
const cache = Multer({dest: homeResolve(config.signServer.cache)});
const {sha2_256} = require('fabric-client/lib/hash');

const fs = require('fs');
/**
 * return two signatures: 1 from orderer 1 from peer
 */
app.post('/', cache.single('proto'), async (req, res) => {
	const ordererOrg = 'NewConsensus';
	const peerOrg = 'NEW';
	const ordererName = 'orderer0';
	const peerName = 'newContainer';
	try {
		if (!req.file) throw 'no attachment file';
		const proto = fs.readFileSync(req.file.path);
		logger.info('sign request', 'hash', sha2_256(proto));

		const ordererClient = clientUtil.new();

		const cryptoPath = new CryptoPath(homeResolve(config.MSPROOT), {
			orderer: {name: ordererName, org: ordererOrg,},
			peer: {name: peerName, org: peerOrg},
			user: {name: 'Admin'}
		});
		const ordererAdmin = await userUtil.loadFromLocal(cryptoPath, 'orderer', config.orderer.orgs[ordererOrg].MSP.id, ordererClient.getCryptoSuite());
		await ordererClient.setUserContext(ordererAdmin, true);
		const peerClient = clientUtil.new();
		const peerAdmin = await userUtil.loadFromLocal(cryptoPath, 'peer', config.orgs[peerOrg].MSP.id, peerClient.getCryptoSuite());
		await peerClient.setUserContext(peerAdmin, true);
		const {signatures} = await signUtil.signs([Promise.resolve(ordererClient),Promise.resolve(peerClient)], proto);

		res.send({signatures:signUtil.toBase64(signatures)});
	} catch (err) {
		logger.error(err);
		res.status(400).send(err.toString());
	}

});