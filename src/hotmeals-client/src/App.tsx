import React, {  useState } from "react";
import * as api from "./util/api";
import * as ui from "./util/ui";
import * as model from "./util/model";
import { Container, Col, Row } from "react-bootstrap";
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import CustomerAccountPage from "./pages/CustomerAccountPage";
import CustomerHomePage from "./pages/CustomerHomePage";
import CustomerOrdering from "./pages/CustomerOrdering";
import CustomerOrders from "./pages/CustomerOrders";
import CustomerRegisterPage from "./pages/CustomerRegisterPage";
import CustomerRestaurants from "./pages/CustomerRestaurants";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import OwnerAccountPage from "./pages/OwnerAccountPage";
import OwnerBlockedUsers from "./pages/OwnerBlockedUsers";
import OwnerHomePage from "./pages/OwnerHomePage";
import OwnerOrders from "./pages/OwnerOrders";
import OwnerRegisterPage from "./pages/OwnerRegisterPage";
import OwnerRestaurantMenu from "./pages/OwnerRestaurantMenu";
import OwnerRestaurants from "./pages/OwnerRestaurants";
import routes from "./routes";
import Loading from "./shared/Loading";

import TopNav from "./shared/TopNav";
import { CurrentUserContext, ApplicationUser, useCurrentUser } from "./user";
import GlobalErrorBoundary from "./util/globalErrorHandling";
import CustomerSearchPage from "./pages/CustomerSearchPage";

/**
 * Main application component.
 * @returns
 */
const App = () => {
    // Holds current user state. As this is the main component it will not get removed unless the browser is refreshed.
    const setCurrentUserCore = (userData: model.UserDTO | null) => {
        setCurrentUser({ userData: userData, isLoading: false, setCurrentUser: setCurrentUserCore });
    };
    let [currentUser, setCurrentUser] = useState<ApplicationUser>({
        userData: null,
        isLoading: true,
        setCurrentUser: setCurrentUserCore,
    });

    // On the first load immediately try to authenticate the user.
    // This will only succeed if we have a valid cookie. If not we will not be able to set the current user and the login dialog will be displayed.
    ui.useAbortableEffect((signal) => {
        setCurrentUser({ userData: currentUser.userData, isLoading: true, setCurrentUser: setCurrentUserCore });
        const fetch = async () => {
            console.log(`Fetching current user`);
            const response = await api.userAuthenticate(signal);
            console.log(`Result: ${JSON.stringify(response)}`);
            if (response.isAborted) return;
            if (response.ok && response.result)
                setCurrentUser({
                    userData: response.result.user,
                    isLoading: false,
                    setCurrentUser: setCurrentUserCore,
                });
            else setCurrentUser({ userData: null, isLoading: false, setCurrentUser: setCurrentUserCore });
        };
        fetch();
    }, []);
    return (
        <GlobalErrorBoundary>
            <CurrentUserContext.Provider value={currentUser}>
                <BrowserRouter>
                    <TopNav />
                    <Container className="py-4">
                        <Row className="justify-content-center">
                            <Col style={{maxWidth: "768px"}}>
                                <AppRoutes />
                            </Col>
                        </Row>
                    </Container>
                </BrowserRouter>
            </CurrentUserContext.Provider>
        </GlobalErrorBoundary>
    );
};

const AppRoutes = () => {
    const currentUser = useCurrentUser();

    const RequiresAuth = (user: model.UserDTO | null, customerComponent: JSX.Element, ownerComponent: JSX.Element) => {
        if (!user)  {
            console.log(`Redirecting to login`);
            return <Redirect to="/login" />;
        }
        if (user.isRestaurantOwner) return ownerComponent;
        if (!user.isRestaurantOwner) return customerComponent;
        return customerComponent;
    };
    
    const RequiresAuthCustomer = (user: model.UserDTO | null, component: JSX.Element) => {
        if (!user)  {
            console.log(`Redirecting to login`);
            return <Redirect to="/login" />;
        }
        if (user.isRestaurantOwner) return <NotFoundPage />;
        return component;
    };
  
    const RequiresAuthOwner = (user: model.UserDTO | null, component: JSX.Element) => {
        if (!user)  {
            console.log(`Redirecting to login`);
            return <Redirect to="/login" />;
        }
        if (!user.isRestaurantOwner) return <NotFoundPage />;
        return component;
    };


    if (currentUser.isLoading)
        return (
            <Col className="d-flex justify-content-center">
                <Loading className="w-25" showLabel />
            </Col>
        );

    return (
        <Switch>
            <Route path={routes.customerSearch}>
                {RequiresAuthCustomer(currentUser.userData, <CustomerSearchPage />)}
            </Route>            
            <Route exact path={routes.customerOrder}>
                {RequiresAuthCustomer(currentUser.userData, <CustomerOrdering />)}
            </Route>
            <Route exact path={routes.customerRestaurants}>
                {RequiresAuthCustomer(currentUser.userData, <CustomerRestaurants />)}
            </Route>
            <Route exact path={routes.customerOrders}>
                {RequiresAuthCustomer(currentUser.userData, <CustomerOrders />)}
            </Route>

            <Route exact path={routes.ownerOrders}>
                {RequiresAuthOwner(currentUser.userData, <OwnerOrders />)}
            </Route>
            <Route exact path={routes.ownerRestaurantOrders}>
                {RequiresAuthOwner(currentUser.userData, <OwnerOrders />)}
            </Route>
            <Route exact path={routes.ownerBlockedUsers}>
                {RequiresAuthOwner(currentUser.userData, <OwnerBlockedUsers />)}
            </Route>
            <Route exact path={routes.ownerRestaurants}>
                {RequiresAuthOwner(currentUser.userData, <OwnerRestaurants />)}
            </Route>
            <Route exact path={routes.ownerRestaurantMenu}>
                {RequiresAuthOwner(currentUser.userData, <OwnerRestaurantMenu />)}
            </Route>
            <Route exact path={routes.homePage}>
                {RequiresAuth(currentUser.userData, <CustomerHomePage />, <OwnerHomePage />)}
            </Route>

            <Route exact path={routes.login}>
                <LoginPage />
            </Route>
            <Route exact path={routes.customerRegister}>
                <CustomerRegisterPage />
            </Route>
            <Route exact path={routes.ownerRegister}>
                <OwnerRegisterPage />
            </Route>
            <Route exact path={routes.userAccount}>
                {RequiresAuth(currentUser.userData, <CustomerAccountPage />, <OwnerAccountPage />)}
            </Route>

            <Route>
                <NotFoundPage />
            </Route>
        </Switch>
    );
};

export default App;
