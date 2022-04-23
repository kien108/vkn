const userRouter = require('./user.router');
const allUserRouter = require('./allUser.router');
const postRouter = require('./post.router');
const allPostRouter = require('./allPost.router');


module.exports = (app) => {
	app.use('/admin/api/v1/user', userRouter);
	app.use('/admin/api/v1/users', allUserRouter);
	app.use('/admin/api/v1/post', postRouter);
	app.use('/admin/api/v1/posts', allPostRouter);
	
};