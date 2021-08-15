import React, { useCallback, useEffect, useState } from "react";
import * as api from "./util/api";
import * as ui from "./util/ui";
import * as model from "./state/model";
import { Container, Col, Row } from "react-bootstrap";
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import CustomerHomePage from "./pages/CustomerHomePage";
import CustomerOrdering from "./pages/CustomerOrdering";
import OrdersActivePage from "./pages/OrdersActivePage";
import OrdersCompletedPage from "./pages/OrdersCompletedPage";
import CustomerRegisterPage from "./pages/CustomerRegisterPage";
import CustomerRestaurants from "./pages/CustomerRestaurantListPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import AccountPage from "./pages/AccountPage";
import OwnerBlockedUsersPage from "./pages/OwnerBlockedUsersPage";
import OwnerHomePage from "./pages/OwnerHomePage";
import OwnerRegisterPage from "./pages/OwnerRegisterPage";
import OwnerRestaurantMenuPage from "./pages/OwnerRestaurantMenuPage";
import OwnerRestaurantListPage from "./pages/OwnerRestaurantListPage";
import routes from "./routes";
import Loading from "./shared/Loading";
import TopNav from "./shared/TopNav";
import { useCurrentUser, setCurrentUser } from "./state/user";
import GlobalErrorBoundary from "./util/global-error-handling";
import CustomerSearchPage from "./pages/CustomerSearchPage";
import OrderNotificationManager from "./shared/OrderNotificationManager";

/**
 * Main application component.
 * @returns
 */
const App = () => {
    const user = useCurrentUser();
    const abort = ui.useAbortable();
    const [authenticating, setAuthenticating] = useState(true);

    const authenticateUser = useCallback(async () => {
        if (user) return;
        setAuthenticating(true);
        const response = await api.userAuthenticate(abort);
        if (response.isAborted) return;
        if (response.ok && response.result) {
            setCurrentUser({ ...response.result.user });
        }
        setAuthenticating(false);
    }, [user, abort]);

    // Whenever the user is not set (on first load or when logged out) we try to automatically authenticate the user.
    // This will only succeed if we have a valid token.
    // If not we will not be able to set the current user and the login dialog will be displayed.
    
    useEffect(() => {
        authenticateUser();
    }, [authenticateUser]);

    return (
        <GlobalErrorBoundary>
            <BrowserRouter>
                <ui.ToastMessageServiceContainer>
                    <TopNav />
                    <Container className="py-4 hm-sticky-margin">
                        <Row className="justify-content-center">
                            <Col style={{ maxWidth: "768px" }}>
                                {authenticating ? <Loading className="w-50" showLabel /> : <AppRoutes />}
                            </Col>
                        </Row>
                        <OrderNotificationManager />
                    </Container>
                </ui.ToastMessageServiceContainer>
            </BrowserRouter>
        </GlobalErrorBoundary>
    );
};

const AppRoutes = () => {
    const currentUser = useCurrentUser();

    // Set of helper functions when help quickly select appropriate component based if the current user is authenticated and the user role (customer / restaurant owner)
    const RequiresAuth = (
        user: model.UserDTO | null,
        customerOrDefaultComponent: JSX.Element,
        ownerComponent?: JSX.Element
    ) => {
        if (!user) {
            console.log(`Redirecting to login`);
            return <Redirect to="/login" />;
        }
        if (user.isRestaurantOwner) return ownerComponent || customerOrDefaultComponent;
        if (!user.isRestaurantOwner) return customerOrDefaultComponent;
        return customerOrDefaultComponent;
    };

    const RequiresAuthCustomer = (user: model.UserDTO | null, component: JSX.Element) => {
        if (!user) {
            console.log(`Redirecting to login`);
            return <Redirect to="/login" />;
        }
        if (user.isRestaurantOwner) return <NotFoundPage />;
        return component;
    };

    const RequiresAuthOwner = (user: model.UserDTO | null, component: JSX.Element) => {
        if (!user) {
            console.log(`Redirecting to login`);
            return <Redirect to="/login" />;
        }
        if (!user.isRestaurantOwner) return <NotFoundPage />;
        return component;
    };

    return (
        <Switch>
            <Route exact path={routes.customerRegister}>
                <CustomerRegisterPage />
            </Route>
            <Route exact path={routes.customerSearch}>
                {RequiresAuthCustomer(currentUser, <CustomerSearchPage />)}
            </Route>
            <Route exact path={routes.customerOrder}>
                {RequiresAuthCustomer(currentUser, <CustomerOrdering />)}
            </Route>
            <Route exact path={routes.customerRestaurants}>
                {RequiresAuthCustomer(currentUser, <CustomerRestaurants />)}
            </Route>

            <Route exact path={routes.ownerBlockedUsers}>
                {RequiresAuthOwner(currentUser, <OwnerBlockedUsersPage />)}
            </Route>
            <Route exact path={routes.ownerRestaurants}>
                {RequiresAuthOwner(currentUser, <OwnerRestaurantListPage />)}
            </Route>
            <Route exact path={routes.ownerRestaurantMenu}>
                {RequiresAuthOwner(currentUser, <OwnerRestaurantMenuPage />)}
            </Route>
            <Route exact path={routes.homePage}>
                {RequiresAuth(currentUser, <CustomerHomePage />, <OwnerHomePage />)}
            </Route>

            <Route exact path={routes.ordersActive}>
                {RequiresAuth(currentUser, <OrdersActivePage />)}
            </Route>
            <Route exact path={routes.ordersCompleted}>
                {RequiresAuth(currentUser, <OrdersCompletedPage />)}
            </Route>
            <Route exact path={routes.userAccount}>
                {RequiresAuth(currentUser, <AccountPage />)}
            </Route>

            <Route exact path={routes.login}>
                <LoginPage />
            </Route>
            <Route exact path={routes.ownerRegister}>
                <OwnerRegisterPage />
            </Route>

            <Route>
                <NotFoundPage />
            </Route>
        </Switch>
    );
};

export default App;
