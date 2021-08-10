import * as Types from "./types";

let serverUrl: string;
if (process.env.NODE_ENV === "production") serverUrl = "/";
else serverUrl = "https://localhost:5001/";

export async function login(req: Types.LoginRequest): Promise<ServerResponseWithData<Types.UserResponse>> {
    return await requestPost<Types.UserResponse>("api/auth/login", req);
}

export async function logout(): Promise<ServerResponse> {
    return await requestPost<void>("api/auth/logout");
}

export async function fetchCurrentUser(): Promise<ServerResponseWithData<Types.UserResponse>> {
    return await requestGet<Types.UserResponse>("api/user/current");
}

export async function register(req: Types.RegisterUserRequest): Promise<ServerResponseWithData<Types.UserResponse>> {
    return await requestPost<Types.UserResponse>("api/user/register", req);
}

export async function updateUser(req: Types.UpdateUserRequest): Promise<ServerResponseWithData<Types.UserResponse>> {
    return await requestPost<Types.UserResponse>("api/user", req);
}

async function request(route: string, req: RequestInit): Promise<ServerResponse> {
    console.log(`%capi: ${route}`, "color: darkblue");
    let result: ServerResponse | null = null;
    try {
        const url = serverUrl + route;
        let response = await fetch(url, req);
        result = {
            ok: response.ok,
            statusCode: response.status,
            statusMessage: response.statusText,
            isBadRequest: !response.ok && response.status === 400,
            isUnauthorized: !response.ok && response.status === 401,
            isForbidden: !response.ok && response.status === 403,
            rawResponse: response,
        };
        if (!response.ok) {
            result.errorDetails = await extractErrorDetails(response);
        }
    } catch (e) {
        if (e.name === "AbortError") {
            result = { ok: false, errorDetails: "Request aborted", isAborted: true };
        } else
            result = {
                ok: false,
                errorDetails: `Network fetch failed '${route}'. Network error: ${(e as Error).message}`,
                isNetworkError: true,
            };
    }
    console.log(`%c ... ${result.statusCode} / ${result.errorDetails} `, "color: darkblue");
    return result;
}

async function requestGet<T>(route: string, req?: RequestInit): Promise<ServerResponseWithData<T>> {
    let response = await request(route, {
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        ...req,
        method: "GET",
        credentials: "include",
    });
    if (!response.ok) return response;
    return await parseResponseBody<T>(response);
}

async function requestPost<T>(route: string, payload?: object, req?: RequestInit): Promise<ServerResponseWithData<T>> {
    let response = await request(route, {
        body: JSON.stringify(payload),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-XSRF-TOKEN": getCookie("XSRF-Api"),
        },
        ...req,
        method: "POST",
        credentials: "include",
    });
    if (!response.ok) return response;
    return await parseResponseBody<T>(response);
}

async function parseResponseBody<T>(response: ServerResponseWithData<T>): Promise<ServerResponseWithData<T>> {
    try {
        let json: T = await response.rawResponse?.json();
        return {
            ...response,
            result: json,
        };
    } catch (e) {
        return {
            ok: false,
            errorDetails: `Failed to parse content as JSON: ${(e as Error).message}`,
        };
    }
}

async function extractErrorDetails(response: Response): Promise<string> {
    try {
        let json: any = await response.json();
        if (json.message) return json.message;
        // Parse .NET model validation error
        if (json.errors) {
            for(let err in json.errors) {
                let errValue = json.errors[err];
                if(Array.isArray(errValue)) {
                    for(let errText of errValue) {
                        return errText;
                    }
                }
                
            }
        }
        return json.toString();
        
    } catch (e) {
        return await response.text();
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
    errorDetails?: string;
    isAborted?: boolean;
    isUnauthorized?: boolean;
    isForbidden?: boolean;
    isBadRequest?: boolean;
    isNetworkError?: boolean;
    rawResponse?: Response;
};

export type ServerResponseWithData<T> = ServerResponse & {
    result?: T;
};
