import React from "react";
import ReactDOM from "react-dom";
//import './index.css';
import App from "./App";
import { ApplicationState, ApplicationStateContext } from "./model/ApplicationState";

import "bootstrap/dist/css/bootstrap.min.css";
const appState = new ApplicationState();

// Try to immediately login
appState.autoLogin();

ReactDOM.render(
    <React.StrictMode>
        <ApplicationStateContext.Provider value={appState}>
            <App />
        </ApplicationStateContext.Provider>
    </React.StrictMode>,
    document.getElementById("root")
);
