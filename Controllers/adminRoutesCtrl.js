const path = require('path');
//----------------Admin routes-----------------------//

function getAdminMenu(req,res){
    res.sendFile(path.join(__dirname, '..', 'View', 'adminMenu.html'));
}
function getAdminCandyzMenu(req,res){
    res.sendFile(path.join(__dirname, '..', 'View', 'adminIceCreamsMenu.html'));
}

function getAdminSearchResults(req,res){
    res.sendFile(path.join(__dirname, '..', 'View', 'searchResults.html'));
}

function getAdminStats(req,res){
    res.sendFile(path.join(__dirname, '..', 'View', 'statsAdmin.html'));
}

function getAdminShopsMenu(req,res){
    res.sendFile(path.join(__dirname, '..', 'View', 'admiGelateriasMenu.html'));
}

module.exports = {getAdminMenu,getAdminCandyzMenu,getAdminSearchResults,getAdminStats,getAdminShopsMenu};