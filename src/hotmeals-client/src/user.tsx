import React, { useContext } from "react";
import { UserDTO } from "./util/api";

export type ApplicationUser = {
    userData: UserDTO | null;
    isLoading: boolean;
    setCurrentUser: (userData: UserDTO | null) => void;
};

const ApplicationUserContext = React.createContext<ApplicationUser>({ userData: null, isLoading: false, setCurrentUser: () => {} });
const useCurrentUser = () => useContext(ApplicationUserContext);

export { ApplicationUserContext as CurrentUserContext, useCurrentUser };
