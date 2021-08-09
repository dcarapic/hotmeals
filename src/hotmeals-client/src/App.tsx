import React, { useEffect, useState } from "react";
import { Container, Col, Row } from "react-bootstrap";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { fetchCurrentUser } from "./api";
import { ErrorBoundary } from "./errorHandling";
import CustomerAccountPage from "./pages/CustomerAccountPage";
import CustomerHomePage from "./pages/CustomerHomePage";
import CustomerRegisterPage from "./pages/CustomerRegisterPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import Loading from "./shared/Loading";

import TopNav from "./shared/TopNav";
import * as Types from "./types";
import { CurrentUserContext, CurrentUser } from "./user";

/**
 * Main application component.
 * @returns 
 */
const App = () => {
    
    // Holds current user state. As this is the main component it will not get removed unless the browser is refreshed.
    const setCurrentUserCore = (user: Types.UserResponse | null) => {
        setCurrentUser({ user: user, isLoading: false, setCurrentUser: setCurrentUserCore });
    };
    let [currentUser, setCurrentUser] = useState<CurrentUser>({
        user: null,
        isLoading: false,
        setCurrentUser: setCurrentUserCore,
    });

    // On the first load immediately try to get the current user information from the server.
    // This will only succeed if we have a valid cookie. If not we will not be able to set the current user and the login dialog will be displayed.
    useEffect(() => {
        if (currentUser.user != null) return;

        setCurrentUser({ ...currentUser, isLoading: true });
        const fetch = async () => {
            console.log(`Fetching current user`);
            const response = await fetchCurrentUser();
            if (response.ok && response.result) setCurrentUserCore(response.result);
            else setCurrentUserCore(null);
        };
        fetch();
    }, []);

    // Wraps component to display a login page in case user is not loaded.
    const RequiresAuth = (component: JSX.Element) => {
        return currentUser.user ? component : <LoginPage />;
    };

    return (
        <ErrorBoundary>
            <CurrentUserContext.Provider value={currentUser}>
                <BrowserRouter>
                    <TopNav />
                    <Container className="mt-2">
                        <Row className="justify-content-md-center">
                            <Col lg="8">
                                {/* Messy routing but fine for our purposes. */}
                                {currentUser.isLoading ? (
                                    <Col className="d-flex justify-content-center">
                                        <Loading className="w-25" showLabel />
                                    </Col>
                                ) : (
                                    <Switch>
                                        <Route path="/account">{RequiresAuth(<CustomerAccountPage />)}</Route>
                                        <Route path="/register-customer">
                                            <CustomerRegisterPage />
                                        </Route>
                                        <Route exact path="/">
                                            {currentUser.user ? (
                                                currentUser.user.isRestaurantOwner ? (
                                                    <CustomerHomePage />
                                                ) : (
                                                    <CustomerHomePage />
                                                )
                                            ) : (
                                                <LoginPage />
                                            )}
                                        </Route>
                                        <Route path="*">
                                            <NotFoundPage />
                                        </Route>
                                    </Switch>
                                )}
                            </Col>
                        </Row>
                    </Container>
                </BrowserRouter>
            </CurrentUserContext.Provider>
        </ErrorBoundary>
    );
};

export default App;
