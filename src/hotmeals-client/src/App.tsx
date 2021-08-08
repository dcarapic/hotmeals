import React, { useEffect, useState } from "react";
import { Container, Col, Row } from "react-bootstrap";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { fetchCurrentUser } from "./api";
import CustomerAccountPage from "./pages/CustomerAccountPage";
import CustomerRegisterPage from "./pages/CustomerRegisterPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import Loading from "./shared/Loading";

import TopNav from "./shared/TopNav";
import * as Types from "./types";
import { CurrentUserContext, CurrentUser } from "./user";

const App = () => {
    const setCurrentUserCore = (user: Types.UserDTO | null) => {
        setCurrentUser({ user: user, isLoading: false, setCurrentUser: setCurrentUserCore });
    };

    let [currentUser, setCurrentUser] = useState<CurrentUser>({
        user: null,
        isLoading: false,
        setCurrentUser: setCurrentUserCore,
    });

    // Try to immediately fetch the current user on load
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

    const RequiresAuth = (component: JSX.Element) => {
        return currentUser.user ? component : <LoginPage />;
    };

    return (
        <CurrentUserContext.Provider value={currentUser}>
            <BrowserRouter>
                <TopNav />
                <Container className="mt-2">
                    <Row className="justify-content-md-center">
                        <Col lg="8">
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
                                        <LoginPage />
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
    );
};

export default App;
