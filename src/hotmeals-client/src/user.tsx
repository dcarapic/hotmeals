import React, { useContext } from "react";
import * as model from "./util/model";

export type ApplicationUser = {
    userData: model.UserDTO | null;
    isLoading: boolean;
    setCurrentUser: (userData: model.UserDTO | null) => void;
};

const ApplicationUserContext = React.createContext<ApplicationUser>({ userData: null, isLoading: false, setCurrentUser: () => {} });
const useCurrentUser = () => useContext(ApplicationUserContext);

export { ApplicationUserContext as CurrentUserContext, useCurrentUser };
