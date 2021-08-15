const JWT_LOCAL_STORAGE_KEY = "Hotmeals_JWT";

export type JwtToken = {
    readonly token: string | null;
    readonly expiresAt: Date | null;
};

const getJWTToken = (): JwtToken => {
    let text = localStorage.getItem(JWT_LOCAL_STORAGE_KEY);
    if (text === null || text === "") {
        return { token: null, expiresAt: null };
    }
    try {
        let storageToken: any = JSON.parse(text);
        if (storageToken && storageToken.token && storageToken.expiresAt) {
            return storageToken;
        }
    } catch {
        // If we fail parsing then we have invalid token
    }
    console.log("jwt-token: invalid token found");
    return { token: null, expiresAt: null };
};

const setJWTToken = (token: string, expiresAtOrInSeconds: Date | number) => {
    let expiresAt: Date;
    if (typeof expiresAtOrInSeconds === "number") {
        expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresAtOrInSeconds);
    } else {
        expiresAt = expiresAtOrInSeconds;
    }
    let jwtToken: JwtToken = { token, expiresAt };
    console.log("jwt-token: stored");
    localStorage.setItem(JWT_LOCAL_STORAGE_KEY, JSON.stringify(jwtToken));
};

const clearJWTToken = () => {
    console.log("jwt-token: cleared");
    localStorage.removeItem(JWT_LOCAL_STORAGE_KEY);
};

export { getJWTToken, setJWTToken, clearJWTToken };
