const User = require('../models/User');
const ForgotPassword = require('../models/ForgotPassword');

const { v4: uuidv4, v5: uuidv5 } = require('uuid');
const bcrypt = require('bcrypt');


const Sib = require('sib-api-v3-sdk');

const tranEmailApi = new Sib.TransactionalEmailsApi();

// Set the Sendinblue API key during the application initialization
const client = Sib.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.EMAIL_API_KEY;



exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ where: { email: email } });

        if (user) {
            const randomUUID = uuidv4();

            await user.createForgotPassword({ id: randomUUID, active: true })
                .catch((err) => {
                    throw new Error(err);
                })

            const sender = {
                email: 'rundan.onkar@gmail.com',
                name: 'Rundan Onkar'
            };

            const receivers = [{email: email}];

            const resetLink = `${process.env.BASE_URL}/password/reset-password/${randomUUID}`

            const emailResponse = await tranEmailApi.sendTransacEmail({
                sender,
                to: receivers,
                subject: 'Reset the password',
                // textContent: 'Visit the link to reset password',
                htmlContent: `<p>Visit the following link to reset your password:</p>
                              <a href="${resetLink}">click here to reset password</a>`
            })

            if(!emailResponse){
                throw new Error('Internal server error')
            }
            
            console.log(emailResponse);
            res.status(200).json({ message: 'Password reset email sent successfully' });
        }
        else {
            res.status(404).json({ message: 'User not found with this email' });
        }
    }
    catch (err) {
        console.log(err)
        res.status(500).json(err.message );
    }

};



exports.resetPassword = async (req, res) => {
    try {
        const resetPasswordReqId = req.params.id;

        const forgotPasswordReq = await ForgotPassword.findOne({ where: { id: resetPasswordReqId } });

        if (forgotPasswordReq && forgotPasswordReq.active) {
            await ForgotPassword.update({ active: false }, { where: { id: resetPasswordReqId } });
            const htmlContent = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
                <link rel="stylesheet" href="/css/resetPassword.css">
            </head>
            
            <body>
                <form onsubmit="validateForm(event)" action="${process.env.BASE_URL}/password/update-password/${resetPasswordReqId}"
                    method="GET">
                    <h1>Reset Password</h1>
                    <label for="newpassword"><b>New Password</b></label>
                    <input name="newpassword" type="password" id="newpassword" required>
                    <label for="confirmpassword"><b>Confirm Password</b></label>
                    <input name="confirmpassword" type="password" id="confirmpassword" required>
                    <button type="submit">Reset Password</button>
                </form>
            </body>
              <script src="/js/resetpassword.js"></script>
            </html>`

            res.status(200).send(htmlContent);
            res.end();
        }
        else {
            throw new Error('Password reset link expired or not found')
        }
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Internal server error' })
    }

}



exports.updatePassword = async (req, res) => {
    const { newpassword } = req.query;
    const { id } = req.params;
    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(newpassword, saltRounds)

        const result = await ForgotPassword.findOne({ where: { id } })

        if (!result || !result.userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        await User.update({ password: hash }, { where: { id: result.userId } })

        res.status(200).json({ message: 'Password updated successfully' });
    }
    catch (err) {
        res.status(500).json(err.message || 'Internal server error')
    }

}

