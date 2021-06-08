generateUniqueId = (prefix, suffix) => {
    const now = new Date();
    if (!suffix)
        suffix = '';
    let timestamp;
    timestamp = now.getFullYear().toString().substring(1,3); // 2011
    timestamp += ("0" + (now.getMonth() + 1)).slice(-2);
    timestamp += ((now.getDate < 10) ? '0' : '') + now.getDate().toString(); // pad with a 0
    timestamp += now.getHours();
    timestamp += now.getMinutes();
    timestamp += now.getSeconds();

    return prefix + timestamp + Math.random().toString(36).substr(2, 4).toUpperCase() + suffix;
}

module.exports = generateUniqueId;
