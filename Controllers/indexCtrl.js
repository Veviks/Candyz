
//----------------Landing page-----------------------//
function getIndexPage(req, res) {
    res.sendFile(__dirname + "/View/index.html");
}

module.exports = {getIndexPage};