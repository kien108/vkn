const nodemailer = require('nodemailer');
const engine = require('express-handlebars');
const hbs = engine.create({ extname: '.hbs' });

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.OUR_EMAIL,
		pass: process.env.EMAIL_PASSWORD
	}
});

async function sendVerify({to, username, token}) {
	try {
		let mailOptions = {
			from: process.env.OUR_EMAIL,
			to,
			subject: 'VKN verification email',
			html: await hbs.render('./src/templates/verify.mail.hbs', { token, username }),
			attachments: [
				{
					filename: 'logo_vkn.png',
					path: './src/templates/images/logo_vkn.png',
					cid: 'logo_image'
				}
			]
		};
		transporter.sendMail(mailOptions, (err, info) => {
			if (err)
				console.log(err);
			else 
				console.log('Email send:', info.response);
		});
	}
	catch(err) { throw err }
};

async function sendResetPassword({ to, username, token }) {
	try {
		let mailOptions = {
			from: process.env.OUR_EMAIL,
			to,
			subject: 'VKN reset password email',
			html: await hbs.render('./src/templates/resetPassword.mail.hbs', { token, username }),
			attachments: [
				{
					filename: 'logo_vkn.png',
					path: './src/templates/images/logo_vkn.png',
					cid: 'logo_image'
				}
			]
		};
		transporter.sendMail(mailOptions, (err, info) => {
			if (err)
				console.log(err);
			else 
				console.log('Email send:', info.response);
		});
	}
	catch(err) { throw err }
}

module.exports = { sendVerify, sendResetPassword };