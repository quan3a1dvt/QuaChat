const jwtVariable = require('../../variables/jwt');
const authMethod = require('./auth.methods');
exports.checkAuthToken = async (accessToken) => {
	const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET || jwtVariable.accessTokenSecret;

	const verified = await authMethod.verifyToken(
		accessToken,
		accessTokenSecret,
	);
	if (!verified) {
		return false
	}

	const userId = verified.payload.id;
	return userId
}
exports.isAuth = async (req, res, next) => {
	// Lấy access token từ header
	const accessTokenFromHeader = req.headers.access_token;
	console.log(accessTokenFromHeader)
	if (!accessTokenFromHeader) {
		return res.status(401).send('Không tìm thấy access token!');
	}

	const accessTokenSecret =
		process.env.ACCESS_TOKEN_SECRET || jwtVariable.accessTokenSecret;

	const verified = await authMethod.verifyToken(
		accessTokenFromHeader,
		accessTokenSecret,
	);
	if (!verified) {
		return res
			.status(401)
			.send('Bạn không có quyền truy cập vào tính năng này!');
	}

	const userId = verified.payload.id;
	req.userId = userId;

	return next();
};
