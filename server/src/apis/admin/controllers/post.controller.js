const User = require('../../../models/user.model');
const Comment = require('../../../models/comment.model');
const Post = require('../../../models/post.model');
const Report = require('../../../models/report.model');
const { getListPostImages } = require('../../../utils/resourceHelper');

const COUNT_ITEM_OF_A_PAGE = 10;
module.exports = {
    // [GET] /v1/posts/number-of-pages
    async getNumberOfPages(req, res) {
        try {
            let { numberRowPerPage } = req.query;
            if (!numberRowPerPage)
                return res.status(400).json({
                    message: 'Missing parameters'
                });
            numberRowPerPage *= 1;
            if (isNaN(numberRowPerPage))
                return res.status(400).json({
                    message: 'Parameters must numbers'
                });
            let numberRow = await Post.countDocuments();
            return res.status(200).json({
                status: 'success',
                numberOfPage: Math.ceil(numberRow / numberRowPerPage)
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: 'error',
                message: 'Error at server'
            });
        }
    },

    // [GET] /v1/posts
    async getPostsOfPage(req, res) {
        try {
            let { numberRowPerPage, pageNumber } = req.query;
            if (!(numberRowPerPage && pageNumber))
                return res.status(400).json({
                    message: 'Missing parameters'
                });
            numberRowPerPage *= 1;
            pageNumber *= 1;
            if (isNaN(numberRowPerPage) || isNaN(pageNumber))
                return res.status(400).json({
                    message: 'Parameters must numbers'
                });
            let posts = await Post.aggregate()
                .lookup({
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                })
                .unwind('user')
                .lookup({
                    from: 'comments',
                    localField: 'comments',
                    foreignField: '_id',
                    as: 'comments'
                })
                .unwind({
                    path: '$comments',
                    preserveNullAndEmptyArrays: true
                })
                .project({
                    user: {
                        username: 1,
                        email: 1
                    },
                    caption: 1,
                    numberOfLikes: 1,
                    numberOfReports: { $size: '$reports' },
                    numberOfComments: {
                        $cond: [
                            { $not: ['$comments'] },
                            0,
                            { $add: [1, { $size: '$comments.replies' }] }
                        ]
                    },
                    createdAt: 1
                })
                .group({
                    _id: '$_id',
                    user: { $first: '$user' },
                    caption: { $first: '$caption' },
                    numberOfLikes: { $first: '$numberOfLikes' },
                    numberOfReports: { $first: '$numberOfReports' },
                    numberOfComments: { $sum: '$numberOfComments' },
                    createdAt: { $first: '$createdAt' }
                });
            // posts.forEach((post, index) => {
            //     console.log(posts[index]);
            //     console.log(getListPostImages(post._id));
            //     posts[index].imgs = getListPostImages(post._id);
            // });
            return res.status(200).json({
                status: 'success',
                data: posts
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                status: 'error',
                message: 'Error at server'
            });
        }
    },

    // [GET] /admin/v1/post/:id
    async getPostById(req, res, next) {
        let id = req.params.id;
        try {
            await Post.findOne({
                _id: id
            })
                .lean()
                .then(data => {
                    res.status(200).json(data);
                })
                .catch(err => {
                    res.status(400).json({
                        status: 'error',
                        message: 'Post not found.'
                    });
                });
        } catch (err) {
            res.status(500).json({
                status: 'error',
                message: 'Error at server'
            });
        }
    },
    async getPostByUserId(req, res, next) {
        let userId = req.params.userId;
        try {
            await Post.find({
                user: userId
            })
                .lean()
                .then(data => {
                    res.status(200).json(data);
                })
                .catch(err => {
                    res.status(400).json({
                        status: 'error',
                        message: 'Post not found.'
                    });
                });
        } catch (err) {
            res.status(500).json({
                status: 'error',
                message: 'Error at server'
            });
        }
    },
    async deletePost(req, res, next) {
        let id = req.params.id;
        let post = await Post.findOne({
            _id: id
        }).lean();
        let listCommentId = post.comments;
        let listReportId = post.reports;

        Promise.all([
            Post.deleteOne({
                _id: id
            }),
            Comment.deleteMany({
                _id: {
                    $in: listCommentId
                }
            }),
            Report.deleteMany({
                _id: {
                    $in: listReportId
                }
            })
        ])
            .then(() => {
                res.status(200).json({
                    status: 'success',
                    message: 'Post has been deleted.'
                });
            })
            .catch(() => {
                res.status(500).json({
                    status: 'error',
                    message: 'Error at server'
                });
            });
    },
    async getAllPost(req, res, next) {
        let sortByNumberOfReport = req.query.sortByNumberOfReport;
        if (sortByNumberOfReport === 'true') {
            await Post.aggregate([
                {
                    $addFields: {
                        report_count: {
                            $size: {
                                $ifNull: ['$reports', []]
                            }
                        }
                    }
                },
                {
                    $sort: {
                        report_count: -1
                    }
                }
            ])
                .then(data => {
                    let lengthData = data.length;
                    let totalPageCount =
                        parseInt(parseFloat(lengthData) / COUNT_ITEM_OF_A_PAGE) ===
                        parseFloat(lengthData) / COUNT_ITEM_OF_A_PAGE
                            ? parseInt(parseFloat(lengthData) / COUNT_ITEM_OF_A_PAGE)
                            : parseInt(parseFloat(lengthData) / COUNT_ITEM_OF_A_PAGE) + 1;
                    res.status(200).json({
                        posts: data,
                        totalPageCount: totalPageCount
                    });
                })
                .catch(() => {
                    res.status(500).json({
                        status: 'error',
                        message: 'Error at server'
                    });
                });
        } else {
            await Post.find({})
                .lean()
                .then(data => {
                    let lengthData = data.length;
                    let totalPageCount =
                        parseInt(parseFloat(lengthData) / COUNT_ITEM_OF_A_PAGE) ===
                        parseFloat(lengthData) / COUNT_ITEM_OF_A_PAGE
                            ? parseInt(parseFloat(lengthData) / COUNT_ITEM_OF_A_PAGE)
                            : parseInt(parseFloat(lengthData) / COUNT_ITEM_OF_A_PAGE) + 1;
                    res.status(200).json({
                        posts: data,
                        totalPageCount: totalPageCount
                    });
                })
                .catch(() => {
                    res.status(500).json({
                        status: 'error',
                        message: 'Error at server'
                    });
                });
        }
    }
};
