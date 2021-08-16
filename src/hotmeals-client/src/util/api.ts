import * as model from "../state/model";
import * as jwt from "../state/jwt-token";

let serverUrl: string;
if (process.env.NODE_ENV === "production") serverUrl = "/";
else serverUrl = "https://localhost:5001/";

export { serverUrl };

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
    let response = await request<LoginRequest, LoginResponse>("Login", "api/user/login", "POST", req, abort);
    // If login successful then preserve token
    if (response.ok && response.result) jwt.setJWTToken(response.result.jwtToken, response.result.expiresInSeconds);
    return response;
}

export async function userLogout(abort?: AbortSignal): Promise<void> {
    await request("Logout", "api/user/logout", "POST", undefined, abort);
    jwt.clearJWTToken();
}

export async function userRegister(
    req: RegisterUserRequest,
    abort?: AbortSignal
): Promise<ServerResponse<RegisterUserResponse>> {
    let response = await request<RegisterUserRequest, RegisterUserResponse>(
        `Register new ${req.isRestaurantOwner ? "restaurant owner" : "customer"}`,
        "api/user",
        "POST",
        req,
        abort
    );
    // If login successful then preserve token
    if (response.ok && response.result) jwt.setJWTToken(response.result.jwtToken, response.result.expiresInSeconds);
    return response;
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

export async function restaurantFetchAll(
    page: number,
    abort?: AbortSignal
): Promise<ServerResponse<GetRestaurantsResponse>> {
    return await request<void, GetRestaurantsResponse>(
        "Fetch all restaurants",
        `api/restaurants?page=${page}`,
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

export async function blockedUsersFetchAll(abort?: AbortSignal): Promise<ServerResponse<GetBlockedUsersResponse>> {
    return await request<void, GetBlockedUsersResponse>(
        "Fetch blocked users",
        `api/blocked-users`,
        "GET",
        undefined,
        abort
    );
}

export async function blockedUsersAdd(email: string, abort?: AbortSignal): Promise<ServerResponse<APIResponse>> {
    email = encodeURIComponent(email);
    return await request<void, APIResponse>("Block user", `api/blocked-users/${email}`, "POST", undefined, abort);
}

export async function blockedUsersRemove(email: string, abort?: AbortSignal): Promise<ServerResponse<APIResponse>> {
    return await request<void, APIResponse>(
        "Delete menu item",
        `api/blocked-users/${email}`,
        "DELETE",
        undefined,
        abort
    );
}

export async function searchFood(
    searchExpression: string,
    page: number,
    abort?: AbortSignal
): Promise<ServerResponse<SearchFoodResponse>> {
    searchExpression = encodeURIComponent(searchExpression);
    return await request<void, SearchFoodResponse>(
        "Search for food",
        `api/search/${searchExpression}?page=${page}`,
        "GET",
        undefined,
        abort
    );
}

export async function orderPlace(
    req: PlaceOrderRequest,
    abort?: AbortSignal
): Promise<ServerResponse<PlaceOrderResponse>> {
    return await request<PlaceOrderRequest, PlaceOrderResponse>("Place order", `api/orders`, "POST", req, abort);
}

export async function orderFetch(orderId: string, abort?: AbortSignal): Promise<ServerResponse<PlaceOrderResponse>> {
    orderId = encodeURIComponent(orderId);
    return await request<PlaceOrderRequest, PlaceOrderResponse>(
        "Fetch order",
        `api/orders/${orderId}`,
        "GET",
        undefined,
        abort
    );
}

export async function ordersFetchActive(page: number, abort?: AbortSignal): Promise<ServerResponse<GetOrdersResponse>> {
    return await request<PlaceOrderRequest, GetOrdersResponse>(
        "Fetch orders",
        `api/orders/active?page=${page}`,
        "GET",
        undefined,
        abort
    );
}

export async function ordersFetchCompleted(
    page: number,
    abort?: AbortSignal
): Promise<ServerResponse<GetOrdersResponse>> {
    return await request<PlaceOrderRequest, GetOrdersResponse>(
        "Fetch orders",
        `api/orders/completed?page=${page}`,
        "GET",
        undefined,
        abort
    );
}

export async function orderUpdateStatus(
    orderId: string,
    status: model.OrderStatus,
    abort?: AbortSignal
): Promise<ServerResponse<UpdateOrderResponse>> {
    orderId = encodeURIComponent(orderId);
    const req: UpdateOrderRequest = { status };
    return await request<UpdateOrderRequest, UpdateOrderResponse>(
        "Update order status",
        `api/orders/${orderId}`,
        "PUT",
        req,
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

export type PagingInformation = {
    totalPages: number;
    page: number;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type LoginResponse = APIResponse & {
    user: model.UserDTO;
    jwtToken: string;
    expiresInSeconds: number;
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
    jwtToken: string;
    expiresInSeconds: number;
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

export type GetRestaurantsResponse = APIResponse &
    PagingInformation & {
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
    restaurantId: string;
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

export type SearchFoodResponse = APIResponse &
    PagingInformation & {
        items: model.SearchResultItemDTO[];
    };

export type PlaceOrderRequest = {
    restaurantId: string;
    items: PlaceOrderRequestMenuItem[];
};

export type PlaceOrderRequestMenuItem = {
    menuItemId: string;
    price: number;
    quantity: number;
};

export type PlaceOrderResponse = APIResponse & {
    order: model.OrderDTO;
};

export type GetOrderResponse = APIResponse & {
    order: model.OrderDTO;
};

export type GetOrdersResponse = APIResponse &
    PagingInformation & {
        orders: model.OrderDTO[];
    };

export type UpdateOrderRequest = {
    status: model.OrderStatus;
};

export type UpdateOrderResponse = APIResponse & {
    order: model.OrderDTO;
};

// Helper functions

async function request<TReq, TResp extends APIResponse>(
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
    let jwtToken = jwt.getJWTToken();
    if (jwtToken.token) headers["Authorization"] = `Bearer ${jwtToken.token}`;

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
    let errorMessage = "Failed to process server response. Please try again later.";
    try {
        if (response.status === 500) return "Error occurred on the server. Please try again later.";
        if (response.status === 401)
            errorMessage = "You are not logged in or your credentials have expired. Please login again.";
        if (response.status === 403) errorMessage = "You do not have permission to access requested resource.";
        let text = await response.text();
        let json: any = JSON.parse(text);
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
        return errorMessage;
    }
}
