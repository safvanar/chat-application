exports.sendMainPage = ( (req, res)=> {
    res.sendFile('index.html', {root: 'views'})
});

exports.sendChatPage = ( (req, res)=> {
    res.sendFile('ezchat.html', {root: 'views'})
});