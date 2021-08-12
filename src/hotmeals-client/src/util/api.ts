import * as model from "./model";

let serverUrl: string;
if (process.env.NODE_ENV === "production") serverUrl = "/";
else serverUrl = "https://localhost:5001/";

// API methods

export async function userAuthenticate(abort?: AbortSignal): Promise<ServerResponse<AuthenticateResponse>> {
    return await request<void, AuthenticateResponse>(
        "Authenticate user",
        "api/user/authenticate",
        "GET",
        undefined,
        abort
    );
}
export async function userLogin(req: LoginRequest, abort?: AbortSignal): Promise<ServerResponse<LoginResponse>> {
    return await request<LoginRequest, LoginResponse>("Login", "api/user/login", "POST", req, abort);
}

export async function userLogout(abort?: AbortSignal): Promise<ServerResponse> {
    return await request("Logout", "api/user/logout", "POST", undefined, abort);
}

export async function userRegister(
    req: RegisterUserRequest,
    abort?: AbortSignal
): Promise<ServerResponse<RegisterUserResponse>> {
    return await request<RegisterUserRequest, RegisterUserResponse>(
        `Register new ${req.isRestaurantOwner ? "restaurant owner" : "customer"}`,
        "api/user",
        "POST",
        req,
        abort
    );
}

export async function userUpdate(
    req: UpdateUserRequest,
    abort?: AbortSignal
): Promise<ServerResponse<UpdateUserResponse>> {
    return await request<UpdateUserRequest, UpdateUserResponse>(
        "Update user information",
        "api/user",
        "PUT",
        req,
        abort
    );
}

export async function restaurantFetchAll(abort?: AbortSignal): Promise<ServerResponse<GetRestaurantsResponse>> {
    return await request<void, GetRestaurantsResponse>(
        "Fetch all restaurants",
        "api/restaurants",
        "GET",
        undefined,
        abort
    );
}
export async function restaurantAdd(
    req: NewRestaurantRequest,
    abort?: AbortSignal
): Promise<ServerResponse<NewRestaurantResponse>> {
    return await request<NewRestaurantRequest, NewRestaurantResponse>(
        "Add new restaurant",
        "api/restaurants",
        "POST",
        req,
        abort
    );
}

export async function restaurantUpdate(
    restaurantId: string,
    req: UpdateRestaurantRequest,
    abort?: AbortSignal
): Promise<ServerResponse<UpdateRestaurantResponse>> {
    return await request<UpdateRestaurantRequest, UpdateRestaurantResponse>(
        "Update restaurant",
        `api/restaurants/${restaurantId}`,
        "PUT",
        req,
        abort
    );
}

export async function restaurantDelete(
    restaurantId: string,
    abort?: AbortSignal
): Promise<ServerResponse<APIResponse>> {
    return await request<void, APIResponse>(
        "Delete restaurant",
        `api/restaurants/${restaurantId}`,
        "DELETE",
        undefined,
        abort
    );
}

export async function menuItemFetchAll(
    restaurantId: string,
    abort?: AbortSignal
): Promise<ServerResponse<GetMenuItemsResponse>> {
    return await request<void, GetMenuItemsResponse>(
        "Fetch menu items for the restaurant",
        `api/restaurants/${restaurantId}/menu`,
        "GET",
        undefined,
        abort
    );
}

export async function menuItemAdd(
    restaurantId: string,
    req: NewMenuItemRequest,
    abort?: AbortSignal
): Promise<ServerResponse<NewMenuItemResponse>> {
    return await request<NewMenuItemRequest, NewMenuItemResponse>(
        "Add new menu item",
        `api/restaurants/${restaurantId}/menu`,
        "POST",
        req,
        abort
    );
}

export async function menuItemUpdate(
    id: string,
    restaurantId: string,
    req: UpdateMenuItemRequest,
    abort?: AbortSignal
): Promise<ServerResponse<UpdateMenuItemResponse>> {
    return await request<UpdateMenuItemRequest, UpdateMenuItemResponse>(
        "Update menu item",
        `api/restaurants/${restaurantId}/menu/${id}`,
        "PUT",
        req,
        abort
    );
}

export async function menuItemDelete(
    id: string,
    restaurantId: string,
    abort?: AbortSignal
): Promise<ServerResponse<APIResponse>> {
    return await request<void, APIResponse>(
        "Delete menu item",
        `api/restaurants/${restaurantId}/menu/${id}`,
        "DELETE",
        undefined,
        abort
    );
}


export async function blockedUsersFetchAll(
    abort?: AbortSignal
): Promise<ServerResponse<GetBlockedUsersResponse>> {
    return await request<void, GetBlockedUsersResponse>(
        "Fetch blocked users",
        `api/blocked-users`,
        "GET",
        undefined,
        abort
    );
}

export async function blockedUsersAdd(
    req: BlockUserRequest,
    abort?: AbortSignal
): Promise<ServerResponse<APIResponse>> {
    return await request<BlockUserRequest, APIResponse>(
        "Block user",
        `api/blocked-users`,
        "POST",
        req,
        abort
    );
}

export async function blockedUsersRemove(
    req: UnblockUserRequest,
    abort?: AbortSignal
): Promise<ServerResponse<APIResponse>> {
    return await request<UnblockUserRequest, APIResponse>(
        "Delete menu item",
        `api/blocked-users`,
        "DELETE",
        undefined,
        abort
    );
}


// objects

export type ServerResponse<T = any> = {
    ok: boolean;
    requestDescription: string;
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

export type APIResponse = {
    isSuccess: boolean;
    errorMessage: string;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type LoginResponse = APIResponse & {
    user: model.UserDTO;
};

export type AuthenticateResponse = APIResponse & {
    user: model.UserDTO;
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
    user: model.UserDTO;
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
    user: model.UserDTO;
};

export type GetRestaurantsResponse = APIResponse & {
    restaurants: model.RestaurantDTO[];
};

export type NewRestaurantRequest = {
    name: string;
    description: string;
    phoneNumber: string;
};

export type NewRestaurantResponse = APIResponse & {
    restaurant: model.RestaurantDTO;
};

export type UpdateRestaurantRequest = {
    name: string;
    description: string;
    phoneNumber: string;
};

export type UpdateRestaurantResponse = APIResponse & {
    restaurant: model.RestaurantDTO;
};

export type GetMenuItemsResponse = APIResponse & {
    restaurantId: string
    restaurantName: string;
    restaurantDescription: string;
    restaurantPhoneNumber: string;
    menuItems: model.MenuItemDTO[];
};

export type NewMenuItemRequest = {
    name: string;
    description: string;
    price: number;
};

export type NewMenuItemResponse = APIResponse & {
    menuItem: model.MenuItemDTO;
};

export type UpdateMenuItemRequest = {
    name: string;
    description: string;
    price: number;
};

export type UpdateMenuItemResponse = APIResponse & {
    menuItem: model.MenuItemDTO;
};




export type GetBlockedUsersResponse = APIResponse & {
    blockedUsers: model.BlockedUserDTO[];
};

export type BlockUserRequest = {
    email: string;
};

export type UnblockUserRequest = {
    email: string;
};

// Helper functions

async function request<TReq = void, TResp = void>(
    requestDescription: string,
    route: string,
    method: "GET" | "POST" | "DELETE" | "PUT",
    request?: TReq,
    abort?: AbortSignal
): Promise<ServerResponse<TResp>> {
    console.log(`%capi:API: ${requestDescription}`, "color: darkblue");
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
            requestDescription: requestDescription,
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
            result = { requestDescription, ok: false, errorDetails: "Request aborted", isAborted: true };
        } else
            result = {
                ok: false,
                requestDescription,
                errorDetails: `Failed to connect to server. The server might not be available or you are not connected to internet.`,
                isNetworkError: true,
            };
    }
    if (result.ok) console.log(`%c ... ${result.statusCode}`, "color: darkblue");
    else console.log(`%c ... ${result.statusCode} / ${result.errorDetails}`, "color: darkblue");

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
