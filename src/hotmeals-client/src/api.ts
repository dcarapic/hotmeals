import * as Types from "./types";

let serverUrl: string;
if (process.env.NODE_ENV === "production") serverUrl = "/";
else serverUrl = "https://localhost:5001/";

export async function login(email: string, password: string): Promise<ServerResponseWithData<Types.UserDTO>> {
    let response = await requestPost<Types.UserDTO>("api/auth/login", {email, password});
    if (response.ok) return await fetchCurrentUser();
    else return { ...response, result: undefined };
}

export async function logout(): Promise<ServerResponse> {
    return await requestPost<void>("api/auth/logout");
}

export async function fetchCurrentUser(): Promise<ServerResponseWithData<Types.UserDTO>> {
    return await requestGet<Types.UserDTO>("api/user/current");
}


async function request(route: string, req: RequestInit): Promise<ServerResponse> {
    console.log(`%capi: ${route}`, "color: gray");
    try {
        const url = serverUrl + route;
        let response = await fetch(url, req);
        return {
            ok: response.ok,
            statusCode: response.status,
            statusMessage: response.statusText,
            isUnauthorized: !response.ok && response.status == 401,
            isForbidden: !response.ok && response.status == 403,
            rawResponse: response,
        };
    } catch (e) {
        if (e.name === "AbortError") return { ok: false, statusMessage: "Request aborted", isAborted: true };
        else
            return {
                ok: false,
                statusMessage: `Network fetch failed '${route}'. Network error: ${(e as Error).message}`,
            };
    }
}

async function requestGet<T>(route: string, req?: RequestInit): Promise<ServerResponseWithData<T>> {
    let response = await request(route, {
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            RequestVerificationToken: getCookie("XSRF-TOKEN"),
        },
        ...req,
        method: "GET",
        credentials: "include",
    });
    if (!response.ok) return response;
    try {
        let json: T = await response.rawResponse?.json();
        return {
            ...response,
            result: json,
        };
    } catch (e) {
        return {
            ok: false,
            statusMessage: `Failed to parse content as JSON: ${(e as Error).message}`,
        };
    }
}

async function requestPost<T>(route: string, payload? : object, req?: RequestInit): Promise<ServerResponseWithData<T>> {
    let response = await request(route, {
        body: JSON.stringify(payload),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        ...req,
        method: "POST",
        credentials: "include",
    });
    if (!response.ok) return response;
    try {
        let json: T = await response.rawResponse?.json();
        return {
            ...response,
            result: json,
        };
    } catch (e) {
        return {
            ok: false,
            statusMessage: `Failed to parse content as JSON: ${(e as Error).message}`,
        };
    }
}

function getCookie(cname: string): string {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(";");
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}


export type ServerResponse = {
    ok: boolean;
    statusCode?: number;
    statusMessage?: string;
    isAborted?: boolean;
    isUnauthorized?: boolean;
    isForbidden?: boolean;
    rawResponse?: Response;
};

export type ServerResponseWithData<T> = ServerResponse & {
    result?: T;
};
