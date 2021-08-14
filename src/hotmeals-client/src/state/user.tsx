import React, { useContext, useState } from "react";
import * as api from "../util/api";
import * as ui from "../util/ui";
import * as model from "../state/model";

export type ApplicationUser = {
    userData: model.UserDTO | null;
    isLoading: boolean;
    setCurrentUser: (userData: model.UserDTO | null) => void;
};

const ApplicationUserContext = React.createContext<ApplicationUser>({ userData: null, isLoading: false, setCurrentUser: () => {} });
const useApplicationUser = () => useContext(ApplicationUserContext);

export { ApplicationUserContext, useApplicationUser as useCurrentUser };
