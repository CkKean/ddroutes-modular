generateDateTime = () => {
    const now = new Date();
    let timestamp;
    timestamp = now.getFullYear().toString(); // 2011
    timestamp += ("0" + (now.getMonth() + 1)).slice(-2);
    timestamp += ((now.getDate < 10) ? '0' : '') + now.getDate().toString(); // pad with a 0
    timestamp += now.getHours();
    timestamp += now.getMinutes();
    timestamp += now.getSeconds();
    return timestamp;
}

module.exports = generateDateTime;
