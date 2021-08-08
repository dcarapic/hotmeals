import React, { Fragment } from "react";
import { Button, Form } from "react-bootstrap";
import RouterNavLink from "../shared/RouterNavLink";

const LoginPage = () => {
    return (
        <Fragment>
            <h3 className="text-center p-2">Welcome to HotMeals, the best place to order your hot and fast food delivery!</h3>
            <Form>
                <Form.Group className="mb-3" controlId="formEmail">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control type="email" placeholder="Enter your email" />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Enter your password" />
                </Form.Group>
                <Button variant="primary" type="submit">
                    Login
                </Button>
            </Form>
            <RouterNavLink to="/register-customer" className="text-center">Register as a new customer ...</RouterNavLink>
            <RouterNavLink to="/register-owner" className="text-center">Register as a new restaurant owner ...</RouterNavLink>
        </Fragment>
    );
};
export default LoginPage;
