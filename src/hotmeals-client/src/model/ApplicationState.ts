import React, { useContext } from "react";
import { makeAutoObservable, runInAction } from "mobx";
import { ServerAPI, ServerResponse } from "../ServerAPI";
import * as Types from "../types";
//import _ from "lodash";

class ApplicationState {
    currentSearchExpression: string | null = null;

    currentUser: Types.UserDTO | null = null;

    lastError: Error | null = null;

    _api: ServerAPI;

    constructor() {
        this._api = new ServerAPI();
        makeAutoObservable(this, {
            _api: false,
        });
    }

    setSearchExpression = (searchExpression: string) => {
        this.currentSearchExpression = searchExpression;
        //this._loadNotes();
    };

    login = async (login: string, password: string): Promise<boolean> => {
        console.log(`ApplicationState.login(login: ${login})`);
        const response = await this._api.login(login, password);
        if (this._validateAPIResponse(response)) {
            runInAction(() => {
                this.currentUser = response.result!;
            });
            return true;
        }
        return false;
    };

    autoLogin = async (): Promise<boolean> => {
        console.log(`ApplicationState.autoLogin()`);
        const response = await this._api.fetchCurrentUser();
        if (this._validateAPIResponse(response)) {
            runInAction(() => {
                this.currentUser = response.result!;
            });
            return true;
        }
        return false;
    };

    logout = async () => {
        console.log(`ApplicationState.logout()`);
        const response = await this._api.logout();
        if (this._validateAPIResponse(response)) {
            runInAction(() => {
                this.currentUser = null;
            });
            return true;
        }
        return false;
    };

    private _setError = (e: Error) => {
        console.log(`ApplicationState error occurred:` + e.message);
        this.lastError = e;
    };

    private _validateAPIResponse = (response: ServerResponse) => {
        if (!response.ok) {
            console.log(`API error: ${JSON.stringify(response)}`);
            // No error message when we are not authorized
            if (!response.isUnauthorized && !response.isAborted)
                runInAction(() => {
                    this.lastError = new Error(response.statusMessage);
                });
            return false;
        }
        return true;
    };
}

const ApplicationStateContext = React.createContext<ApplicationState>(new ApplicationState());
const useApplicationState = () => useContext(ApplicationStateContext);

export { ApplicationState, useApplicationState, ApplicationStateContext };
