import React from "react";
import { Container, Col, Row } from "react-bootstrap";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import CustomerAccountPage from "./pages/CustomerAccountPage";
import CustomerRegisterPage from "./pages/CustomerRegisterPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";

import TopNav from "./shared/TopNav";

const App = () => (
    <BrowserRouter>
        <TopNav />
        <Container className="mt-2">
            <Row className="justify-content-md-center">
                <Col lg="8">
                    <Switch>
                        <Route path="/account">
                            <CustomerAccountPage />
                        </Route>
                        <Route path="/register-customer">
                            <CustomerRegisterPage />
                        </Route>
                        <Route exact path="/">
                            <LoginPage />
                        </Route>
                        <Route path="*">
                            <NotFoundPage/>
                        </Route>
                    </Switch>
                </Col>
            </Row>
        </Container>
    </BrowserRouter>
);

export default App;
