import React, { useContext } from "react";

import * as Types from "./types";

export type CurrentUser = {
    user: Types.UserDTO | null;
    isLoading: boolean;
    setCurrentUser: (user: Types.UserDTO | null) => void;
};

const CurrentUserContext = React.createContext<CurrentUser>({ user: null, isLoading: false, setCurrentUser: () => {} });
const useCurrentUser = () => useContext(CurrentUserContext);

export { CurrentUserContext, useCurrentUser };