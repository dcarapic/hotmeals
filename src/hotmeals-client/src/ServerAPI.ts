import * as Types from "./types";

export class ServerAPI {
    private readonly _url: string;

    constructor() {
        if (process.env.NODE_ENV === "production") this._url = "/";
        else this._url = "https://localhost:5001/";
    }

    
    async login(
        email: string,
        password: string
    ): Promise<ServerResponseWithData<Types.UserDTO>> {
        const url = this._url + "api/auth/login";
        const loginReq: Types.LoginRequestDTO = { email, password };
        let response = await this._wrapJsonFetch("Logging in", () =>
            fetch(url, {
                method: "POST",
                headers: this._createFetchHeader(),
                body: JSON.stringify(loginReq),
                credentials: 'include'
            })
        );
        if(response.ok)
            return await this.fetchCurrentUser();
        else
            return { ...response, result: undefined };
    }
   
    async logout(): Promise<ServerResponse> {
        const url = this._url + "api/auth/logout";
        let response = await this._wrapFetch("Logging out", () =>
            fetch(url, {
                method: "POST",
                headers: this._createPostHeader(),
                credentials: 'include'
            })
        );
        return response;
    }

    async fetchCurrentUser(): Promise<ServerResponseWithData<Types.UserDTO>> {
        const url = this._url + "api/user/current";
        const result = await this._wrapJsonFetch<Types.UserDTO>("Fetching user", () =>
            fetch(url, {
                headers: this._createFetchHeader(),
                credentials: 'include'
            })
        );
        return result;
    }
    
    private async _wrapFetch(requestDescription: string, method: () => Promise<Response>): Promise<ServerResponse> {
        console.log(`%capi: ${requestDescription}`, "color: gray");
        let response: Response | undefined;
        try {
            response = await method();
            return {
                ok: response.ok,
                statusCode: response.status,
                statusMessage: response.statusText,
                isUnauthorized: !response.ok && response.status == 401,
                isForbidden: !response.ok && response.status == 403,
            };
        } catch (e) {
            if (e.name === "AbortError") return { ok: false, statusMessage: "Request aborted", isAborted: true };
            else
                return {
                    ok: false,
                    statusMessage: `Failed to execute request '${requestDescription}'. Network error: ${
                        (e as Error).message
                    }`,
                };
        }
    }

    private async _wrapJsonFetch<T>(
        requestDescription: string,
        method: () => Promise<Response>
    ): Promise<ServerResponseWithData<T>> {
        console.log(`%capi: ${requestDescription}`, "color: gray");
        let response: Response | undefined;
        try {
            response = await method();
            if (!response.ok)
                return {
                    ok: false,
                    statusCode: response.status,
                    statusMessage: response.statusText,
                    isUnauthorized: !response.ok && response.status == 401,
                    isForbidden: !response.ok && response.status == 403,
                };
            let json: T = await response.json();
            return {
                ok: response.ok,
                statusCode: response.status,
                statusMessage: response.statusText,
                result: json,
                isUnauthorized: false,
                isForbidden: false,
            };
        } catch (e) {
            if (e.name === "AbortError") return { ok: false, statusMessage: "Request aborted", isAborted: true };
            else
                return {
                    ok: false,
                    statusMessage: `Failed to execute request '${requestDescription}'. Network error: ${
                        (e as Error).message
                    }`,
                };
        }
    }

    private _createFetchHeader(): HeadersInit {
        return {
            Accept: "application/json",
            "Content-Type": "application/json",
        };
    }

    
    private _createPostHeader(): HeadersInit {
        return {
            RequestVerificationToken: this._getCookie("XSRF-TOKEN"),
            ...this._createFetchHeader()
        };
    }

    private _getCookie(cname : string) : string {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
}

export type ServerResponse = {
    ok: boolean;
    statusCode?: number;
    statusMessage?: string;
    isAborted?: boolean;
    isUnauthorized?: boolean;
    isForbidden?: boolean;
};

export type ServerResponseWithData<T> = ServerResponse & {
    result?: T;
};
