import React, { useContext } from "react";
import { UserDTO } from "./api";

export type CurrentUser = {
    userData: UserDTO | null;
    isLoading: boolean;
    setCurrentUser: (userData: UserDTO | null) => void;
};

const CurrentUserContext = React.createContext<CurrentUser>({ userData: null, isLoading: false, setCurrentUser: () => {} });
const useCurrentUser = () => useContext(CurrentUserContext);

export { CurrentUserContext, useCurrentUser };
