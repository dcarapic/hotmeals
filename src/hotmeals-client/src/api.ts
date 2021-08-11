import { DependencyList, useEffect, useState } from "react";

let serverUrl: string;
if (process.env.NODE_ENV === "production") serverUrl = "/";
else serverUrl = "https://localhost:5001/";

// API methods

export async function userAuthenticate(abort?: AbortSignal): Promise<ServerResponse<AuthenticateResponse>> {
    return await request<void, AuthenticateResponse>("api/user/authenticate", "GET", undefined, abort);
}
export async function userLogin(req: LoginRequest, abort?: AbortSignal): Promise<ServerResponse<LoginResponse>> {
    return await request<LoginRequest, LoginResponse>("api/user/login", "POST", req, abort);
}

export async function userLogout(abort?: AbortSignal): Promise<ServerResponse> {
    return await request("api/user/logout", "POST", undefined, abort);
}

export async function userRegister(
    req: RegisterUserRequest,
    abort?: AbortSignal
): Promise<ServerResponse<RegisterUserResponse>> {
    return await request<RegisterUserRequest, RegisterUserResponse>("api/user", "POST", req, abort);
}

export async function userUpdate(
    req: UpdateUserRequest,
    abort?: AbortSignal
): Promise<ServerResponse<UpdateUserResponse>> {
    return await request<UpdateUserRequest, UpdateUserResponse>("api/user", "PUT", req, abort);
}

export async function restaurantFetchAll(abort?: AbortSignal): Promise<ServerResponse<GetRestaurantsResponse>> {
    return await request<void, GetRestaurantsResponse>("api/restaurants", "GET", undefined, abort);
}
export async function restaurantAdd(
    req: NewRestaurantRequest,
    abort?: AbortSignal
): Promise<ServerResponse<NewRestaurantResponse>> {
    return await request<NewRestaurantRequest, NewRestaurantResponse>("api/restaurants", "POST", req, abort);
}

export async function restaurantUpdate(
    req: UpdateRestaurantRequest,
    abort?: AbortSignal
): Promise<ServerResponse<UpdateRestaurantResponse>> {
    return await request<UpdateRestaurantRequest, UpdateRestaurantResponse>("api/restaurants", "PUT", req, abort);
}

export async function restaurantDelete(
    req: DeleteRestaurantRequest,
    abort?: AbortSignal
): Promise<ServerResponse<DeleteRestaurantResponse>> {
    return await request<DeleteRestaurantRequest, DeleteRestaurantResponse>("api/restaurants", "DELETE", req, abort);
}

// objects

export type ServerResponse<T = any> = {
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
    result?: T;
};

export type UserDTO = {
    email: string;
    firstName: string;
    lastName: string;
    addressCityZip: string;
    addressCity: string;
    addressStreet: string;
    password: string;
    isRestaurantOwner: boolean;
};

export type RestaurantDTO = {
    id: string;
    name: string;
    description: string;
    phoneNumber: string;
};

export type APIResponse = {
    isSuccess: boolean;
    errorMessage: string;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type LoginResponse = APIResponse & {
    user: UserDTO;
};

export type AuthenticateResponse = APIResponse & {
    user: UserDTO;
};

export type RegisterUserRequest = {
    email: string;
    firstName: string;
    lastName: string;
    addressCityZip: string;
    addressCity: string;
    addressStreet: string;
    password: string;
    isRestaurantOwner: boolean;
};

export type RegisterUserResponse = APIResponse & {
    user: UserDTO;
};

export type UpdateUserRequest = {
    firstName: string;
    lastName: string;
    addressCityZip: string;
    addressCity: string;
    addressStreet: string;
    newPassword?: string;
};

export type UpdateUserResponse = APIResponse & {
    user: UserDTO;
};

export type GetRestaurantsResponse = APIResponse & {
    restaurants: RestaurantDTO[];
};

export type NewRestaurantRequest = {
    name: string;
    description: string;
    phoneNumber: string;
};

export type NewRestaurantResponse = APIResponse & {
    restaurant: RestaurantDTO;
};

export type UpdateRestaurantRequest = {
    id: string;
    name: string;
    description: string;
    phoneNumber: string;
};

export type UpdateRestaurantResponse = APIResponse & {
    restaurant: RestaurantDTO;
};

export type DeleteRestaurantRequest = {
    id: string;
};

export type DeleteRestaurantResponse = APIResponse;

// Helper functions

async function request<TReq = void, TResp = void>(
    route: string,
    method: "GET" | "POST" | "DELETE" | "PUT",
    request?: TReq,
    abort?: AbortSignal
): Promise<ServerResponse<TResp>> {
    console.log(`%capi: ${route}`, "color: darkblue");
    let result: ServerResponse<TResp> | null = null;

    const headers: any = {
        Accept: "application/json",
        "Content-Type": "application/json",
    };
    const init: RequestInit = {
        headers: headers,
        method: method,
        credentials: "include",
    };
    if (abort) init.signal = abort;
    if (request) init.body = JSON.stringify(request);
    if (method !== "GET") headers["X-XSRF-TOKEN"] = getCookie("X-XSRF-TOKEN");

    try {
        const url = serverUrl + route;
        let response = await fetch(url, init);
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
        } else {
            await updateResultFromBody<TResp>(result);
        }
    } catch (e) {
        if (e.name === "AbortError") {
            result = { ok: false, errorDetails: "Request aborted", isAborted: true };
        } else
            result = {
                ok: false,
                errorDetails: `Failed to connect to server. The server might not be available or you are not connected to internet.`,
                isNetworkError: true,
            };
    }
    console.log(`%c ... ${result.statusCode} / ${result.errorDetails} `, "color: darkblue");
    return result;
}

async function updateResultFromBody<T>(response: ServerResponse<T>): Promise<void> {
    try {
        let json: T = await response.rawResponse?.json();
        response.result = json;
    } catch (e) {
        response.ok = false;
        response.errorDetails = `Failed to process server response: ${e.toString()}`;
    }
}

async function extractErrorDetails(response: Response): Promise<string> {
    try {
        let json: any = await response.json();
        if (json.errorMessage) return json.errorMessage;
        // Parse .NET model validation error
        if (json.errors) {
            for (let err in json.errors) {
                let errValue = json.errors[err];
                if (Array.isArray(errValue)) {
                    for (let errText of errValue) {
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

/**
 * React hook which returns an abort signal which is automatically raised if a component has been dismounted.
 */
const useAbortable = (): AbortSignal => {
    let [controller, _ ] = useState(new AbortController());
    useEffect(() => {
        return () => controller.abort();
    }, []);
    return controller.signal;
};

/**
 * React effect hook which provides abort signal which is automatically raised if a component has been dismounted.
 */
const useAbortableEffect = (effect: (signal: AbortSignal) => void, deps?: DependencyList) => {
    useEffect(() => {
        let controller = new AbortController();
        effect(controller.signal);
        return () => controller.abort();
    }, deps);
};

export { useAbortableEffect, useAbortable };
