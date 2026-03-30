const userStreams = new Map();

export const addUserStream = (userId, res) => {
    const key = String(userId);
    const set = userStreams.get(key) || new Set();
    set.add(res);
    userStreams.set(key, set);
};

export const removeUserStream = (userId, res) => {
    const key = String(userId);
    const set = userStreams.get(key);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) userStreams.delete(key);
};

export const publishToUser = (userId, event, payload = {}) => {
    const key = String(userId);
    const set = userStreams.get(key);
    if (!set || set.size === 0) return;

    const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const res of set) {
        try {
            res.write(message);
        } catch {
            // ignore broken stream writes
        }
    }
};

export const getStreamStats = () => {
    let connections = 0;
    userStreams.forEach((set) => {
        connections += set.size;
    });

    return { users: userStreams.size, connections };
};
